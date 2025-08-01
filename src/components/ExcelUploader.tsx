import React, { act, useState } from 'react';
import * as XLSX from 'xlsx';
import { IDsGenerator, IDsGeneratorRandom } from '../utils/IDsGenerator';
import { Activity, UnitActivity } from '../types';
import { PRODUCTION_URL } from '../urls';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getActivityCode, setFormatBooleans } from '../utils/ActivityTypesUtil';
import { updateActivityDescriptionAndInstructions } from '../utils/Description&InstructionUtil';
import { downloadTaxonomyAllFormats } from '../utils/FormatFileUtil';
import { returnVersionComment } from '../utils/VersionTracker';
import axios from 'axios';

const EMPTY_ACTIVITY: Activity = {
  activityId: '', activityName: '', displayName: '', activityPath: '', activityURL: '', activityType: '', type: '', description: '', instruction: '', trainerNotes: '',
  duration: 0, tags: [], skills: [], createdAt: new Date(), isReview: false, isOptional: false, maxScore: 0, githubRepositoryUrl: '',
  vsCodeExtensions: '', artifactAttachments: [], urlAttachments: [], isILT: true, isIST: true, isPLT: true,
}

type ParsedRow = Record<string, any>;

const ExcelUploader: React.FC = () => {
  const [data, setData] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);

  const downloadFile = async (fileName: string, content: string) => {
    const fileData = JSON.stringify(content);
    // create a blob and remove all unnecessary fields
    const blob = new Blob([fileData], { type: 'text/json' });
    const url = URL.createObjectURL(blob);
    const linkElement = document.createElement('a');
    linkElement.download = `${fileName}`;
    linkElement.href = url;
    linkElement.click();
    setLoading(false);
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLoading(true);
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      const binaryStr = e.target?.result;
      if (!binaryStr) return;

      // get sheets:
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const taxonomySheet = workbook.Sheets['Taxonomy'];
      const exitCriteriaSheet = workbook.Sheets['Exit Criteria'];
      const metadataSheet = workbook.Sheets['Metadata'];

      let unitName = file.name.substring(0, file.name.lastIndexOf('.'));
      // remove "Structure" from the unit name if it exists
      if (unitName.endsWith("Structure")) {
        unitName = unitName.substring(0, unitName.lastIndexOf("Structure")).trim();
      }


      // parse into JSON:
      const taxonomyJson = XLSX.utils.sheet_to_json<ParsedRow>(taxonomySheet);
      const exitCriteriaJson = XLSX.utils.sheet_to_json<ParsedRow>(exitCriteriaSheet);
      const metadataJson = XLSX.utils.sheet_to_json<ParsedRow>(metadataSheet, { range: 1 });


      // convert the Excel data to JSON, which will be used to generate the navigation JSON, the zip structure, and the save JSON
      const result = await parseTaxonomyExcel(taxonomyJson, unitName);

      const parsedTaxonomy = result.unit;
      const externalActivities = result.externalActivities;

      // 
      const navigation_json = await generate_navigation_json(parsedTaxonomy, exitCriteriaJson, metadataJson, file.name);
      const format_files = await addActivityFields(structuredClone(parsedTaxonomy));

      // download the artifacts:
      generateZipStructure(parsedTaxonomy, unitName, format_files, navigation_json, externalActivities);
    };

    reader.readAsBinaryString(file);
  };

  const parseTaxonomyExcel = async (raw_json: any[], fileName: string) => {
    const unit: any = {
      modules: [],
      unitActivities: [],
      id: await IDsGenerator(fileName),
      title: fileName,
      description: '',
    };

    let externalActivities = [];

    for (const row of raw_json) {
      const moduleTitle = row.Module?.trim();
      const topicTitle = row.Topic?.trim();

      let currentModule = null;
      let currentTopic = null;

      // === 1. Find or create the Module ===
      if (moduleTitle && moduleTitle !== "N/A") {
        currentModule = unit.modules.find((mod: any) => mod.title === moduleTitle);

        if (!currentModule) {
          currentModule = {
            id: await IDsGenerator(moduleTitle),
            title: moduleTitle,
            description: '',
            topics: [],
            moduleActivities: [],
          };
          unit.modules.push(currentModule);
        }
      }

      // === 2. Find or create the Topic inside the Module ===
      if (topicTitle && topicTitle !== "N/A" && currentModule) {
        currentTopic = currentModule.topics.find((top: any) => top.title === topicTitle);

        if (!currentTopic) {
          currentTopic = {
            id: await IDsGenerator(topicTitle),
            title: topicTitle,
            description: '',
            topicActivities: [],
          };
          currentModule.topics.push(currentTopic);
        }
      }

      // === 3. Parse the Activity ===
      const activityName = row["Activity Name"]?.trim();
      if (!activityName) continue;

      const activity: any = {
        ...EMPTY_ACTIVITY,
        activityId: IDsGeneratorRandom(),
        activityName,
        displayName: row["Display Name"]?.trim(),
        activityType: row["Activity Type"],
        type: 'HARDCODED VALUE',
        duration: row["Duration"],
        isReview: row["Activity Grouping"]?.trim() === "Review",
      };

      let unitName = unit.title.replace(/ Unit/g, '');
      const formattedUnitName = `TTSP-${unitName.replace(/ /g, '%20')}`;
      const repoPrefix = `https://dev.azure.com/Revature-Technology/Technology-Engineering/_git/${formattedUnitName}?path=`;

      // If the activityURL is not an azure link, delete activityPath field since it is not needed:
      if (!row["Content URL"].startsWith('https://dev.azure.com/Revature-Technology/Technology-Engineering/')) {
        activity.activityURL = row["Content URL"];
        delete activity.activityPath; // Remove activityPath since we are not using it
      }

      // if the activityURL is an azure link and the file is local, then update the activityPath and delete activityURL:
      else if (row["Content URL"].startsWith(repoPrefix)) {
        let path = row["Content URL"].replace(repoPrefix, '');
        path = path.split('&')[0];
        activity.activityPath = '.' + path;
        delete activity.activityURL; // Remove activityURL since we are using activityPath now

      }

      else {
        const url = row["Content URL"];
        const res = await axios.post(`${PRODUCTION_URL}/fetch-azure-file`, { url });
        const content = res.data.content;
        const markdown = JSON.parse(content).content;
        externalActivities.push({ name: row["Activity Name"], content: markdown });
        activity.activityPath = `./external-activities/${activity.activityName}.md`;
        delete activity.activityURL;
      }

      // === 4. Assign Activity based on Scope ===
      const scope = row["Activity Scope"]?.trim();
      if (scope === 'Unit') {
        unit.unitActivities.push(activity);
      } else if (scope === 'Module' && currentModule) {
        currentModule.moduleActivities.push(activity);
      } else if (scope === 'Topic' && currentTopic) {
        currentTopic.topicActivities.push(activity);
      } else {
        console.warn(`Activity "${activityName}" has an invalid scope: [${scope}]`);
      }
    }

    return {unit, externalActivities};
  };



  const generateZipStructure = async (unit: any, unitName: string, format_files: any, navigation_json: any, externalActivities: any) => {
    const zip = new JSZip();
    const rootFolder = zip.folder(unitName || 'unit');
    const moduleContainerFolder = rootFolder?.folder('modules');

    const externalActivitiesFolder = rootFolder?.folder('external-activities');
    for(const activity of externalActivities) {
      externalActivitiesFolder?.file(`${activity.name}.md`, activity.content);
    }


    let moduleCount = 1;
    for (const module of unit.modules) {
      const moduleFolder = moduleContainerFolder?.folder(String(moduleCount).padStart(3, '0') + '-' + module.title);

      let topicCount = 1;
      for (const topic of module.topics) {
        const topicFolder = moduleFolder?.folder(String(topicCount).padStart(3, '0') + '-' + topic.title);
        for (const activity of topic.topicActivities) {
          updateActivityDescriptionAndInstructions(activity, unit.title);
          const fileContent = 'Activity Name: ' + activity.displayName + '\n' +
            'Activity URL: ' + activity.activityURL + '\n' +
            'Activity Description: ' + activity.description;
          topicFolder?.file(`${activity.activityName}.md`, fileContent);
        }
        topicCount++;

      }

      for (const activity of module.moduleActivities) {
        updateActivityDescriptionAndInstructions(activity, unit.title);
        const fileContent = 'Activity Name: ' + activity.displayName + '\n' +
          'Activity URL: ' + activity.activityURL + '\n' +
          'Activity Description: ' + activity.description;
        moduleFolder?.file(`${activity.activityName}.md`, fileContent);
      }
      moduleCount++;


    }

    for (const activity of unit.unitActivities) {
      updateActivityDescriptionAndInstructions(activity, unit.title);
      const fileContent = 'Activity Name: ' + activity.displayName + '\n' +
        'Activity URL: ' + activity.activityURL + '\n' +
        'Activity Description: ' + activity.description;
      rootFolder?.file(`${activity.activityName}.md`, fileContent);
    }

    navigation_json.templates = [`${unit.title}-taxonomy-ILT`, `${unit.title}-taxonomy-IST`, `${unit.title}-taxonomy-PLT`];


    rootFolder?.file(`navigation.json`, JSON.stringify(navigation_json, null, 2));
    rootFolder?.file(`${unit.title}-taxonomy-ILT.json`, JSON.stringify(format_files.ILTFormatFile, null, 2));
    rootFolder?.file(`${unit.title}-taxonomy-IST.json`, JSON.stringify(format_files.ISTFormatFile, null, 2));
    rootFolder?.file(`${unit.title}-taxonomy-PLT.json`, JSON.stringify(format_files.PLTFormatFile, null, 2));
    rootFolder?.file(`${unit.title}-version-metadata.md`, returnVersionComment());

    // Generate and trigger download
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${unitName || 'unit'}-generated-files.zip`);
  };

  const generate_navigation_json = async (parsedExcel: any, exit_criteria_json: any[], metadata_json: any[], fileName: string) => {
    let navigation_json: any = structuredClone(parsedExcel);
    navigation_json = {
      ...navigation_json,
      exitcriteria: [],
      tags: [],
      skill: parsedExcel.title
    }

    // sum up the duration of all activities in the unit:
    let totalDuration = 0;
    for (const activity of navigation_json.unitActivities) {
      totalDuration += activity.duration || 0;
    }
    for (const module of navigation_json.modules) {
      for (const activity of module.moduleActivities) {
        totalDuration += activity.duration || 0;
      }
      for (const topic of module.topics) {
        for (const activity of topic.topicActivities) {
          totalDuration += activity.duration || 0;
        }
      }
    }

    navigation_json.duration = totalDuration;

    // Exit Criteria:
    for (const row of exit_criteria_json) {
      const exitCriteriaTitle = row["Exit Criteria"]?.trim();
      const assessmentApproach = row["Assessment Approach"]?.trim();
      navigation_json.exitcriteria.push({
        title: exitCriteriaTitle,
        assessmentApproach,
      });
    }

    // Metadata:
    for (const row of metadata_json) {
      navigation_json.tags.push(row["Tag Value"]?.trim());

    }

    // Navigation JSON:
    delete navigation_json.unitActivities; // Remove activities from navigation_json to avoid duplication
    for (const module of navigation_json.modules) {
      delete module.moduleActivities; // Remove activities from each module
      for (const topic of module.topics) {
        delete topic.topicActivities; // Remove activities from each topic
      }
    }

    return navigation_json;
  };


  const addActivityFields = async (parsedTaxonomy: any) => {
    let save_file = structuredClone(parsedTaxonomy);

    // unit:
    delete save_file.description;
    for (const activity of save_file.unitActivities) {
      activity.type = getActivityCode(activity.activityType);
      setFormatBooleans(activity);
      updateActivityDescriptionAndInstructions(activity, save_file.title);
    }
    //modules:
    let moduleCount = 1;
    for (const module of save_file.modules) {
      delete module.description;
      for (const activity of module.moduleActivities) {
        activity.type = getActivityCode(activity.activityType);
        setFormatBooleans(activity);
        updateActivityDescriptionAndInstructions(activity, save_file.title);
      }
      //topics:
      let topicCount = 1;
      for (const topic of module.topics) {
        delete topic.description;
        for (const activity of topic.topicActivities) {
          activity.type = getActivityCode(activity.activityType);
          setFormatBooleans(activity);
          updateActivityDescriptionAndInstructions(activity, save_file.title);
        }
        topicCount++;
      }
      moduleCount++;
    }

    downloadFile('Use-This-To-Update-Activities.json', save_file);

    return downloadTaxonomyAllFormats(save_file);
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
      {loading && <img src = './loading.gif' width = '50px' />}
    </div>
  );
};

export default ExcelUploader;
