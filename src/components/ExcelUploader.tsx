import React, { act, useState } from 'react';
import * as XLSX from 'xlsx';
import { IDsGenerator } from '../utils/IDsGenerator';
import { Activity, UnitActivity } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getActivityCode, setFormatBooleans } from '../utils/activityCodes';

const EMPTY_ACTIVITY: Activity = {
  activityId: '', activityName: '', activityPath: '', activityURL: '', activityType: '', type: '', description: '', instruction: '', trainerNotes: '',
  duration: 0, tags: [], skills: [], createdAt: new Date(), isReview: false, isOptional: false, maxScore: 0, githubRepositoryUrl: '',
  vsCodeExtensionUrl: '', artifactAttachments: [], urlAttachments: [], isILT: true, isIST: true, isPLT: true,
}

type ParsedRow = Record<string, any>;

const ExcelUploader: React.FC = () => {
  const [data, setData] = useState<ParsedRow[]>([]);

  const downloadFile = async (fileName: string, content: string) => {
    const fileData = JSON.stringify(content);
    // create a blob and remove all unnecessary fields
    const blob = new Blob([fileData], { type: 'text/json' });
    const url = URL.createObjectURL(blob);
    const linkElement = document.createElement('a');
    linkElement.download = `${fileName}`;
    linkElement.href = url;
    linkElement.click();
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

      const unitName = file.name.substring(0, file.name.lastIndexOf('.'));


      // parse into JSON:
      const taxonomyJson = XLSX.utils.sheet_to_json<ParsedRow>(taxonomySheet);
      const exitCriteriaJson = XLSX.utils.sheet_to_json<ParsedRow>(exitCriteriaSheet);
      const metadataJson = XLSX.utils.sheet_to_json<ParsedRow>(metadataSheet, { range: 1 });


      // convert the Excel data to JSON, which will be used to generate the navigation JSON, the zip structure, and the save JSON
      const parsedTaxonomy = await parseTaxonomyExcel(taxonomyJson, unitName);

      // 
      const navigation_json = await generate_navigation_json(parsedTaxonomy, exitCriteriaJson, metadataJson, file.name);
      const save_file = await addActivityFields(structuredClone(parsedTaxonomy));;

      // download the artifacts:
      await downloadFile(`${unitName}.json`, navigation_json);
      await downloadFile(`${unitName}-save.json`, save_file);
      generateZipStructure(parsedTaxonomy, unitName);
    };

    reader.readAsBinaryString(file);
  };

  const parseTaxonomyExcel = async (raw_json: any[], fileName: string) => {
    let moduleCount = 0;
    let topicCount = 0;

    let lastModuleTitle = '';
    let lastTopicTitle = '';

    let currentModule: any = null;
    let currentTopic: any = null;

    const unit: any = {
      modules: [],
      unitActivities: [],
      id: await IDsGenerator(fileName),
      title: fileName,
      description: '',
    };

    for (const row of raw_json) {
      const moduleTitle = row.Module?.trim();
      const topicTitle = row.Topic?.trim();

      // Check and add module if it's new and valid
      if (moduleTitle && moduleTitle !== "N/A" && moduleTitle !== lastModuleTitle) {
        // If we had a previous topic, push it into the previous module before resetting
        if (currentTopic && currentModule) {
          currentModule.topics.push(currentTopic);
          currentTopic = null;
        }

        // If there's an existing module, push it to the unit before creating a new one
        if (currentModule) {
          unit.modules.push(currentModule);
        }

        currentModule = {
          id: await IDsGenerator(moduleTitle),
          moduleCount: ++moduleCount,
          title: moduleTitle,
          description: '',
          topics: [],
          moduleActivities: [],
        };

        topicCount = 0; // Reset topic count for the new module
        lastModuleTitle = moduleTitle;
        lastTopicTitle = '';
      }

      // Check and add topic if it's new and valid
      if (topicTitle && topicTitle !== "N/A" && topicTitle !== lastTopicTitle) {
        if (currentTopic && currentModule) {
          currentModule.topics.push(currentTopic);
        }

        currentTopic = {
          id: await IDsGenerator(topicTitle),
          topicCount: ++topicCount,
          title: topicTitle,
          description: '',
          topicActivities: [],
        };

        lastTopicTitle = topicTitle;
      }

      // Parse and assign activities
      const activityName = row["Activity Name"]?.trim();
      if (!activityName) continue;

      const activity: any = {
        ...EMPTY_ACTIVITY,
        activityId: await IDsGenerator(activityName),
        activityName,
        activityURL: row["Content URL"],
        activityType: row["Activity Type"],
        type: 'HARDCODED VALUE',
        duration: row["Duration"],
        isReview: row["Activity Grouping"]?.trim() === "Review",
      };

      const scope = row["Activity Scope"]?.trim();
      if (scope === 'Unit') {
        unit.unitActivities.push(activity);
      } else if (scope === 'Module' && currentModule) {
        currentModule.moduleActivities.push(activity);
      } else if (scope === 'Topic' && currentTopic) {
        currentTopic.topicActivities.push(activity);
      }
    }

    // Push final topic and module
    if (currentTopic && currentModule) {
      currentModule.topics.push(currentTopic);
    }
    if (currentModule) {
      unit.modules.push(currentModule);
    }

    return unit;
  };


  const generateZipStructure = async (navigation_json: any, unitName: string) => {
    const zip = new JSZip();
    const rootFolder = zip.folder(unitName || 'unit');
    const moduleContainerFolder = rootFolder?.folder('modules');

    for (const module of navigation_json.modules) {
      const moduleFolder = moduleContainerFolder?.folder(String(module.moduleCount).padStart(3, '0') + '-' + module.title);

      for (const topic of module.topics) {
        const topicFolder = moduleFolder?.folder(String(topic.topicCount).padStart(3, '0') + '-' + topic.title);

        for (const activity of topic.topicActivities) {
          const fileContent = 'Activity Name: ' + activity.activityName + '\n' +
            'Activity URL: ' + activity.activityURL + '\n' +
            'Activity Description: ';
          topicFolder?.file(`${activity.activityName}.md`, fileContent);
        }

      }

      for (const activity of module.moduleActivities) {
        const fileContent = 'Activity Name: ' + activity.activityName + '\n' +
          'Activity URL: ' + activity.activityURL + '\n' +
          'Activity Description: ';
        moduleFolder?.file(`${activity.activityName}.md`, fileContent);
      }


    }

    for (const activity of navigation_json.unitActivities) {
      const fileContent = 'Activity Name: ' + activity.activityName + '\n' +
        'Activity URL: ' + activity.activityURL + '\n' +
        'Activity Description: ';
      rootFolder?.file(`${activity.activityName}.md`, fileContent);
    }

    // Generate and trigger download
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${navigation_json.title || 'unit'}.zip`);
  };

  const generate_navigation_json = async (parsedExcel: any, exit_criteria_json: any[], metadata_json: any[], fileName: string) => {
    let navigation_json: any = structuredClone(parsedExcel);
    navigation_json = {
      ...navigation_json,
      exitCriteria: [],
      tags: [],
      skills: []
    }

    // Exit Criteria:
    for (const row of exit_criteria_json) {
      const exitCriteriaTitle = row["Exit Criteria"]?.trim();
      const difficulty = row["Criteria Difficulty"]?.trim();
      const assessmentApproach = row["Assessment Approach"]?.trim();
      navigation_json.exitCriteria.push({
        title: exitCriteriaTitle,
        difficulty,
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
      delete module.moduleCount; // Remove moduleCount from each module
      for (const topic of module.topics) {
        delete topic.topicActivities; // Remove activities from each topic
        delete topic.topicCount; // Remove topicCount from each topic
      }
    }



    return navigation_json;
  };


  const addActivityFields = async (parsedTaxonomy: any) => {
    console.log('parsedTaxonomy', parsedTaxonomy);
    let save_file = structuredClone(parsedTaxonomy);

    // unit:
    delete save_file.description;
    for (const activity of save_file.unitActivities) {
      activity.activityPath = './' + activity.activityName + '.md';
      activity.type = getActivityCode(activity.activityType);
      setFormatBooleans(activity);
    }
    //modules:
    for (const module of save_file.modules) {
      delete module.description;
      for (const activity of module.moduleActivities) {
        activity.activityPath = './modules/' + String(module.moduleCount).padStart(3, '0') + '-' + module.title + '/' + activity.activityName + '.md';
        activity.type = getActivityCode(activity.activityType);
        setFormatBooleans(activity);
      }
      //topics:
      for (const topic of module.topics) {
        delete topic.description;
        for (const activity of topic.topicActivities) {
          activity.activityPath = './modules/' + String(module.moduleCount).padStart(3, '0') + '-' + module.title + '/' + String(topic.topicCount).padStart(3, '0') + '-' + topic.title + '/' + activity.activityName + '.md';
          activity.type = getActivityCode(activity.activityType);
          setFormatBooleans(activity)
        }
      }
    }

    // remove moduleCount and topicCount from the JSON:
    for (const module of save_file.modules) {
      delete module.moduleCount;
      for (const topic of module.topics) {
        delete topic.topicCount;
      }
    }

    console.log('save_file', save_file);

    return save_file;
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
    </div>
  );
};

export default ExcelUploader;
