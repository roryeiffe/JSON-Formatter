import React, { useState } from 'react';
import { IDsGeneratorRandom } from '../utils/IDsGenerator';
import { ParsedRow, Unit, FormatBools, ParseContext, ExternalActivity, TaxonomyRow, FormatFiles, ActivityIds, NavigationJson } from '../types';
import JSZip from 'jszip';
import { setFormatBooleans } from '../utils/ActivityTypesFormatsUtil';
import { updateActivityDescriptionAndInstructions } from '../utils/ActivityFieldGeneration';
import { prepFormatFiles } from '../utils/FormatFileUtil';
import { parseUploadedExcel } from '../utils/ExcelHelper';
import { assignActivityByScope, buildBaseActivity, fetchExistingActivityIds, getOrCreateModuleTopic, postProcessActivity, resolveActivityContent } from '../utils/ParsingHelper';
import { generate_navigation_json } from '../utils/NavigationHelper';
import { createZipFolders, finalizeAndDownloadZip, writeExternalActivities, writeRootArtifacts, writeUnitStructureFiles } from '../utils/DownloadHelper';

const ExcelUploader: React.FC = () => {
  const [loading, setLoading] = useState(false);

  /**
   * This is triggered when we upload our excel file. Afterwards, the following workflow takes place:
   * 1. Parse the excel into raw json rows (uses helper functions from ExcelHelper.ts)
   * 2. Process the raw json into a structured unit representation (uses helper functions from ParsingHelper.ts)
   * 3. Generate navigation.json (uses helper functions from NavigationHelper.ts)
   * 4. Update activity fields and prepare format files (uses helper functions from FormatFileUtil.ts)
   * 5. Generate zip structure and download (uses helper functions from DownloadHelper.ts)
   * @param event 
   * @returns 
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    try {
      setLoading(true);
      if (!file) return;

      const { unitName, taxonomyRows, exitCriteriaRows, metadataRows } = await parseUploadedExcel(file);

      const { unit, externalActivities, formatsToDownload, errorOccurredLocal, activityIds } =
        await parseRawJSON(taxonomyRows, unitName);

      if (errorOccurredLocal) {
        alert("Some errors occurred while processing the activities. Please check the console for details.");
        return;
      }

      const navigationJson = await generate_navigation_json(unit, exitCriteriaRows, metadataRows);
      const formatFiles = await updateActivityFields(structuredClone(unit), activityIds);

      generateZipStructure(unit, unitName, formatFiles, navigationJson, externalActivities, formatsToDownload);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };


  /**
   * This function takes the raw json that was converted from excel and 
   * formats it in a way that can be used in the navigation.json and format files
   * This function utilizes a context object that allows us to pass along common data,
   * like the unit representation, from function to function (found in ParsingHelper.ts)
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

  /**
   * Creates a clone of the given taxonomy and updates the activity fields using the
   * Activity util files (ActivityTypesUtil.ts and ActivityFieldGeneration.ts)
   * @param parsedTaxonomy 
   * @param activityIds 
   * @returns 
   */
  const updateActivityFields = async (parsedTaxonomy: Unit, activityIds: ActivityIds) => {
    let taxonomyClone = structuredClone(parsedTaxonomy);

    // unit:
    delete taxonomyClone.description;
    for (const activity of taxonomyClone.unitActivities!) {
      setFormatBooleans(activity);
      updateActivityDescriptionAndInstructions(activity, taxonomyClone.title);
    }
    //modules:
    let moduleCount = 1;
    for (const module of taxonomyClone.modules) {
      delete module.description;
      for (const activity of module.moduleActivities!) {
        setFormatBooleans(activity);
        updateActivityDescriptionAndInstructions(activity, taxonomyClone.title);
      }
      //topics:
      let topicCount = 1;
      for (const topic of module.topics) {
        delete topic.description;
        for (const activity of topic.topicActivities!) {
          setFormatBooleans(activity);
          updateActivityDescriptionAndInstructions(activity, taxonomyClone.title);
        }
        topicCount++;
      }
      moduleCount++;
    }

    return prepFormatFiles(taxonomyClone, activityIds);
  };



  /**
   * Generates and downloads the final structure including:
   * - navigation.json
   * - format files (ILT always; IST/PLT optionally)
   * - module/topic/unit structure (activity stub .md files)
   * - external activities (markdown + assets)
   */
  const generateZipStructure = async (
    unit: Unit,
    unitName: string,
    format_files: FormatFiles,
    navigation_json: NavigationJson,
    externalActivities: ExternalActivity[],
    formatsToDownload: FormatBools
  ) => {
    const zip = new JSZip();

    const { rootFolder, moduleContainerFolder, externalActivitiesFolder } =
      createZipFolders(zip, unitName);

    writeExternalActivities(externalActivitiesFolder, externalActivities);

    writeUnitStructureFiles(rootFolder, moduleContainerFolder, unit);

    writeRootArtifacts(rootFolder, unit.title, navigation_json, format_files, formatsToDownload);

    await finalizeAndDownloadZip(zip, unitName);
  };

  return (
    <div className="p-4 border rounded-md shadow-md max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Upload Excel File</h2>
      <input className="mt-2 m-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold rounded-lg shadow-lg transform text-center transition duration-300 ease-in-out hover:scale-105 hover:shadow-2xl mx-auto focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer mb-8"
        type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      {loading && <img src='./loading.gif' width='50px' />}
    </div>
  );
};

export default ExcelUploader;