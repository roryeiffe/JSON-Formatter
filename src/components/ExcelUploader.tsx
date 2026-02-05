import React, { act, useState } from 'react';
import * as XLSX from 'xlsx';
import { IDsGeneratorRandom } from '../utils/IDsGenerator';
import { Activity, ParsedRow, UnitActivity, TaxonomyRow, Unit,  FormatBools, ParseContext } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getActivityCode, setFormatBooleans } from '../utils/ActivityTypesUtil';
import { updateActivityDescriptionAndInstructions } from '../utils/ActivityFieldGeneration';
import { downloadTaxonomyAllFormats } from '../utils/FormatFileUtil';
import { returnVersionComment } from '../utils/VersionTracker';
import { parseUploadedExcel } from '../utils/ExcelHelper';
import { sanitizeFilename } from '../utils/Sanitization';
import { assignActivityByScope, buildBaseActivity, fetchExistingActivityIds, getOrCreateModuleTopic, postProcessActivity, resolveActivityContent } from '../utils/ParsingHelper';
import { generate_navigation_json } from '../utils/NavigationHelper';




const ExcelUploader: React.FC = () => {
  const [data, setData] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * This is triggered when we upload our excel file
   * @param event 
   * @returns 
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  try {
    setLoading(true);

    const file = event.target.files?.[0];
    if (!file) return;

    // Step 1–3 helper: handles FileReader + XLSX.read + sheet_to_json + unitName derivation
    const payload = await parseUploadedExcel(file);

    // --- Step 4 logic still lives here (temporarily) ---
    const result = await parseRawJSON(payload.taxonomyRows, payload.unitName);

    if (result.errorOccurredLocal) {
      alert("Some errors occurred while processing the activities. Please check the console for details.");
      return;
    }

    const parsedTaxonomy:Unit = result.unit;
    const externalActivities = result.externalActivities;
    const formatsToDownload = result.formatsToDownload;

    const navigation_json = await generate_navigation_json(
      parsedTaxonomy,
      payload.exitCriteriaRows,
      payload.metadataRows
    );

    const format_files = await addActivityFields(
      structuredClone(parsedTaxonomy),
      result.activityIds
    );

    // download the artifacts:
    generateZipStructure(
      parsedTaxonomy,
      payload.unitName,
      format_files,
      navigation_json,
      externalActivities,
      formatsToDownload
    );
  } catch (err) {
    console.error(err);
    alert(err instanceof Error ? err.message : "Upload failed.");
  } finally {
    setLoading(false);

    // Optional: allow re-uploading the exact same file without needing to pick a different one first
    event.target.value = "";
  }
};


/**
 * This function takes the raw json that was converted from excel and 
 * formats it in a way that can be used in the navigation.json and format files
 * This function utilizes a context object that allows us to pass along common data,
 * like the unit representation, as we invoke each of the helper functions (found in ParsingHelper.ts)
 * @param raw_taxonomy_json rows from the taxonomy sheet
 * @param fileName name of unit (derived from file)
 */
const parseRawJSON = async (raw_taxonomy_json: TaxonomyRow[], fileName: string) => {
  const unit: Unit = {
    modules: [],
    unitActivities: [],
    id: IDsGeneratorRandom(),
    title: fileName,
    description: "",
  };

  const ctx: ParseContext = {
    unit,
    externalActivities: [],
    errorOccurredLocal: false,
    activityIds: await fetchExistingActivityIds(unit.title),
    dummyActivityTypes: new Set<string>(),
    emptyActivityCount: 0,
    nonEmptyActivityCount: 0,
    idCache: new Map<string, string>(),
  };

  // for each in the excel, we process the json using the helper methods
  for (const row of raw_taxonomy_json) {
    const moduleTitle = row.Module?.trim();
    const topicTitle = row.Topic?.trim();

    // create/get module/topic
    const { currentModule, currentTopic } = await getOrCreateModuleTopic(ctx, moduleTitle, topicTitle);

    // create activity
    const activity = await buildBaseActivity(ctx, row);
    if (!activity) continue;

    // Handle the activity content itself, based on url
    await resolveActivityContent(ctx, activity, row, unit.title, moduleTitle, topicTitle);
    postProcessActivity(activity);

    // Assign activity to the corresponding unit/module/topic
    assignActivityByScope(ctx, activity, row["Activity Scope"], currentModule, currentTopic);
  }

  if (ctx.emptyActivityCount > 0) {
    alert(
      "Some activities were missing URLs and have been replaced with dummy activities. Please check the external-activities folder in the generated zip."
    );
  }

  const formatsToDownload: FormatBools = {
    ILT: true,
    IST: ctx.nonEmptyActivityCount > 0,
    PLT: ctx.emptyActivityCount === 0,
  };

  return {
    unit: ctx.unit,
    externalActivities: ctx.externalActivities,
    errorOccurredLocal: ctx.errorOccurredLocal,
    activityIds: ctx.activityIds,
    formatsToDownload,
  };
};




  const generateZipStructure = async (unit: Unit, unitName: string, format_files: any, navigation_json: any, externalActivities: any, formatsToDownload: any) => {

    const zip = new JSZip();
    const rootFolder = zip.folder(unitName || 'unit');
    const moduleContainerFolder = rootFolder?.folder('modules');

    const externalActivitiesFolder = rootFolder?.folder('external-activities');
    for (const activity of externalActivities) {
      for (const img of activity.imgs) {
        img.newName = activity.name + 'Assets/' + img.name;
        // replace all instances of the old image name in the markdown content with the new path
        activity.content = activity.content.replace(new RegExp(img.oldName, 'g'), img.newName);
        // save image data to the specified file name within the external-activities folder
        externalActivitiesFolder?.file(img.newName, img.imgData, { base64: true });
      }
      for (const gift of activity.gifts) {
        gift.newName = activity.name + 'Assets/' + gift.name;
        activity.content = activity.content.replace(new RegExp(gift.oldName, 'g'), gift.newName);
        externalActivitiesFolder?.file(gift.newName, gift.giftData, { base64: true });
      }
      externalActivitiesFolder?.file(`${activity.name}.md`, activity.content);

    }




    let moduleCount = 1;
    for (const module of unit.modules) {
      if (!module.title) {
        console.warn(`Module ${moduleCount} has no title, skipping...`);
        continue;
      }
      const moduleFolder = moduleContainerFolder?.folder(String(moduleCount).padStart(3, '0') + '-' + sanitizeFilename(module.title));

      let topicCount = 1;
      for (const topic of module.topics) {
        if (!topic.title) {
          console.warn(`Topic ${topicCount} in Module ${module.title} has no title, skipping...`);
          continue;
        }
        const topicFolder = moduleFolder?.folder(String(topicCount).padStart(3, '0') + '-' + sanitizeFilename(topic.title));
        for (const activity of topic.topicActivities) {
          updateActivityDescriptionAndInstructions(activity, unit.title);

          let activityUrl = activity.activityURL || activity.activityPath || activity.githubRepositoryUrl;


          const fileContent = 'Activity Name: ' + activity.displayName + '\n' +
            'Activity URL: ' + activityUrl + '\n' +
            'Activity Description: ' + activity.description;
          topicFolder?.file(`${sanitizeFilename(activity.activityName)}.md`, fileContent);
          if (activity.activityPath || activity.githubRepositoryUrl) delete activity.activityURL;
        }
        topicCount++;

      }

      for (const activity of module.moduleActivities) {
        updateActivityDescriptionAndInstructions(activity, unit.title);
        let activityUrl = activity.activityURL || activity.activityPath || activity.githubRepositoryUrl;
        const fileContent = 'Activity Name: ' + activity.displayName + '\n' +
          'Activity URL: ' + activityUrl + '\n' +
          'Activity Description: ' + activity.description;
        moduleFolder?.file(`${sanitizeFilename(activity.activityName)}.md`, fileContent);
        if (activity.activityPath || activity.githubRepositoryUrl) delete activity.activityURL;
      }
      moduleCount++;


    }


    for (const activity of unit.unitActivities) {
      updateActivityDescriptionAndInstructions(activity, unit.title);
      let activityUrl = activity.activityURL || activity.activityPath || activity.githubRepositoryUrl;
      const fileContent = 'Activity Name: ' + activity.displayName + '\n' +
        'Activity URL: ' + activityUrl + '\n' +
        'Activity Description: ' + activity.description;
      rootFolder?.file(`${sanitizeFilename(activity.activityName)}.md`, fileContent);
      if (activity.activityPath || activity.githubRepositoryUrl) delete activity.activityURL;
    }

    navigation_json.templates = [`${sanitizeFilename(unit.title)}-taxonomy-ILT`, `${sanitizeFilename(unit.title)}-taxonomy-IST`, `${sanitizeFilename(unit.title)}-taxonomy-PLT`];

    if (!formatsToDownload.IST) {
      navigation_json.templates = navigation_json.templates.filter((template: string) => !template.endsWith('-IST'));
    }

    if (!formatsToDownload.PLT) {
      navigation_json.templates = navigation_json.templates.filter((template: string) => !template.endsWith('-PLT'));
    }


    rootFolder?.file(`navigation.json`, JSON.stringify(navigation_json, null, 2));
    rootFolder?.file(`${sanitizeFilename(unit.title)}-taxonomy-ILT.json`, JSON.stringify(format_files.ILTFormatFile, null, 2));
    if (formatsToDownload.IST) rootFolder?.file(`${sanitizeFilename(unit.title)}-taxonomy-IST.json`, JSON.stringify(format_files.ISTFormatFile, null, 2));
    if (formatsToDownload.PLT) rootFolder?.file(`${sanitizeFilename(unit.title)}-taxonomy-PLT.json`, JSON.stringify(format_files.PLTFormatFile, null, 2));
    rootFolder?.file(`${sanitizeFilename(unit.title)}-version-metadata.md`, returnVersionComment());

    // Generate and trigger download
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${unitName || 'unit'}-generated-files.zip`);
  };

  


  const addActivityFields = async (parsedTaxonomy: any, activityIds: any) => {
    let save_file = structuredClone(parsedTaxonomy);

    // unit:
    delete save_file.description;
    for (const activity of save_file.unitActivities) {
      setFormatBooleans(activity);
      updateActivityDescriptionAndInstructions(activity, save_file.title);
    }
    //modules:
    let moduleCount = 1;
    for (const module of save_file.modules) {
      delete module.description;
      for (const activity of module.moduleActivities) {
        setFormatBooleans(activity);
        updateActivityDescriptionAndInstructions(activity, save_file.title);
      }
      //topics:
      let topicCount = 1;
      for (const topic of module.topics) {
        delete topic.description;
        for (const activity of topic.topicActivities) {
          setFormatBooleans(activity);
          updateActivityDescriptionAndInstructions(activity, save_file.title);
        }
        topicCount++;
      }
      moduleCount++;
    }

    return downloadTaxonomyAllFormats(save_file, activityIds);
  };

  return (
    <div className="p-4 border rounded-md shadow-md max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Upload Excel File</h2>
      <input className="mt-2 m-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold rounded-lg shadow-lg transform text-center transition duration-300 ease-in-out hover:scale-105 hover:shadow-2xl mx-auto focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer mb-8"
        type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />

      {data.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Parsed Data Preview:</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-x-auto max-h-64">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      {loading && <img src='./loading.gif' width='50px' />}
    </div>
  );
};

export default ExcelUploader;
