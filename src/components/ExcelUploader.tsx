import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { IDsGenerator } from '../utils/IDsGenerator';
import { Activity, UnitActivity } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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

      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const taxonomySheet = workbook.Sheets['Taxonomy'];
      const exitCriteriaSheet = workbook.Sheets['Exit Criteria'];
      const metadataSheet = workbook.Sheets['Metadata'];

      const taxonomyJson = XLSX.utils.sheet_to_json<ParsedRow>(taxonomySheet);
      const exitCriteriaJson = XLSX.utils.sheet_to_json<ParsedRow>(exitCriteriaSheet);
      const metadataJson = XLSX.utils.sheet_to_json<ParsedRow>(metadataSheet, { range: 1 });
      const navigation_json = await generate_navigation_json(taxonomyJson, exitCriteriaJson, metadataJson, file.name);
      const navigation_json_with_activities = await addActivitiesToNavigationJson(structuredClone(navigation_json), taxonomyJson);

      const unitName = file.name.substring(0, file.name.lastIndexOf('.'));
      await downloadFile(`${unitName}.json`, navigation_json);
      await downloadFile(`${unitName}-save.json`, navigation_json_with_activities);

      const parsedExcel = await parseExcel(taxonomyJson);

      generateZipStructure(parsedExcel, unitName);
      

    };

    reader.readAsBinaryString(file);
  };

  const generateZipStructure = async (navigation_json: any, unitName: string) => {
    const zip = new JSZip();
    const rootFolder = zip.folder(unitName || 'unit');
    const moduleContainerFolder = rootFolder?.folder('modules');
  
    for (const module of navigation_json.modules) {
      const moduleFolder = moduleContainerFolder?.folder(String(module.moduleCount).padStart(3, '0') + '-' + module.title);
  
      for (const topic of module.topics) {
        const topicFolder = moduleFolder?.folder(String(topic.topicCount).padStart(3, '0') + '-' + topic.title);
  
        for(const activity of topic.activities) {
          const fileContent = 'Activity Name: ' + activity.activityName + '\n' +
            'Activity URL: ' + activity.activityURL + '\n' +
            'Activity Description: ';
          topicFolder?.file(`${activity.activityName}.md`, fileContent);
        }
  
      }

      for(const activity of module.activities) {
        const fileContent = 'Activity Name: ' + activity.activityName + '\n' +
          'Activity URL: ' + activity.activityURL + '\n' +
          'Activity Description: ';
        moduleFolder?.file(`${activity.activityName}.md`, fileContent);
      }
  
      
    }

    for(const activity of navigation_json.activities) {
      const fileContent = 'Activity Name: ' + activity.activityName + '\n' +
        'Activity URL: ' + activity.activityURL + '\n' +
        'Activity Description: ';
      rootFolder?.file(`${activity.activityName}.md`, fileContent);
    }
  
    // Generate and trigger download
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${navigation_json.title || 'unit'}.zip`);
  };


  const parseExcel = async (raw_json: any[]) => {
    let moduleCount = 0;
    let topicCount = 0;

    let lastModuleTitle = '';
    let lastTopicTitle = '';
  
    let currentModule: any = null;
    let currentTopic: any = null;
  
    const unit: any = {
      modules: [],
      activities: [],
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
          activities: [],
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
          activities: [],
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
        unit.activities.push(activity);
      } else if (scope === 'Module' && currentModule) {
        currentModule.activities.push(activity);
      } else if (scope === 'Topic' && currentTopic) {
        currentTopic.activities.push(activity);
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
  

  const generate_navigation_json = async (raw_json: any[], exit_criteria_json: any[], metadata_json: any[], fileName: string) => {
    const navigation_json: any = {
      id: await IDsGenerator(fileName),
      title: fileName,
      description: '',
      modules: [],
      exitCriteria: [],
      tags: [],
      skills: []
    };

    let lastModuleTitle = '';
    let lastTopicTitle = '';
    let currentModule: any = null;

    // Exit Criteria:
    for (const row of exit_criteria_json) {
      const exitCriteriaTitle = row["Exit Criteria"]?.trim();
      navigation_json.exitCriteria.push(exitCriteriaTitle);
    }

    // Metadata:
    for (const row of metadata_json) {
      navigation_json.tags.push(row["Tag Value"]?.trim());

    }

    // Navigation JSON:
    for (const row of raw_json) {
      const moduleTitle = row.Module?.trim();
      const topicTitle = row.Topic?.trim();

      // Add new module if it's different and valid
      if (moduleTitle && moduleTitle !== "N/A" && moduleTitle !== lastModuleTitle) {
        currentModule = {
          id: await IDsGenerator(moduleTitle),
          title: moduleTitle,
          description: '',
          topics: [],
        };
        navigation_json.modules.push(currentModule);
        lastModuleTitle = moduleTitle;
        lastTopicTitle = ''; // Reset topic tracking when a new module starts
      }

      // Add new topic if it's different and valid
      if (topicTitle && topicTitle !== "N/A" && topicTitle !== lastTopicTitle && currentModule) {
        currentModule.topics.push({
          id: await IDsGenerator(topicTitle),
          title: topicTitle,
          description: '',
        });
        lastTopicTitle = topicTitle;
      }
    }
    return navigation_json;
  };

  const addActivitiesToNavigationJson = async (navigation_json: any, raw_json: any) => {
    // Ensure unit-level activity array is initialized
    navigation_json.unitActivities ??= [];

    // Initialize module and topic activity arrays
    for (const module of navigation_json.modules) {
      module.moduleActivities ??= []; // Fix: spelling was "moduleActivites"
      for (const topic of module.topics) {
        topic.topicActivities ??= [];
      }
    }

    // Loop through the raw JSON data and add activities to the appropriate module or topic
    for (const row of raw_json) {
      const activityName = row["Activity Name"]?.trim();
      if (!activityName) continue; // Skip invalid rows

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
      switch (scope) {
        case 'Unit':
          navigation_json.unitActivities.push({
            ...activity,
            unitId: navigation_json.id,
          });
          break;

        case 'Module':
          const moduleTitle = row["Module"]?.trim();
          const module = navigation_json.modules.find((mod: any) => mod.title === moduleTitle);
          if (module) {
            module.moduleActivities.push({
              ...activity,
              moduleId: module.id,
            });
          }
          break;
        case 'Topic':
          const topicTitle = row["Topic"]?.trim();
          const moduleTitleForTopic = row["Module"]?.trim();
          const moduleForTopic = navigation_json.modules.find((mod: any) => mod.title === moduleTitleForTopic);
          if (moduleForTopic) {
            const topic = moduleForTopic.topics.find((top: any) => top.title === topicTitle);
            if (topic) {
              topic.topicActivities.push({
                ...activity,
                topicId: topic.id,
              });
            }
          }
          break;
      }
    }

    return navigation_json;
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
