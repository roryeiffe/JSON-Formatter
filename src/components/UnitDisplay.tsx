import React, { useState, useEffect, useMemo, act } from "react";

import { Activity, HierarchyItem, HierarchyType, Unit } from "../types";
import '../styles/UnitDisplay.css';

import AddActivity from "./AddActivity";
import UploadJSON from "./UploadJSON";

type activityKey = "isILT" | "isIST" | "isPLT";

// Check if the activity already exists in the list of activities
// This is used to prevent duplicates when adding activities to the unit/module/topic
const checkActivityExists = (activityToAdd: Activity, activities: Activity[]) => {
  let found = false;
  for (const activity of activities) {
    if (activity.activityName === activityToAdd.activityName && activity.activityType === activityToAdd.activityType) {
      found = true;
      break;
    }
  }
  return found;
}

// Create simplified version of the data, removing unnecessary ids, etc.
const createFilteredProxy: any = (data: Unit, excludeKeys = ["prerequisites", 'description', "tooltip", "url"]) => {
  if (Array.isArray(data)) {
    return data.map(item => createFilteredProxy(item, excludeKeys));
  } else if (typeof data === "object" && data !== null) {
    // If it's a Date, return it as is
    if (data instanceof Date) {
      return data;
    }

    return new Proxy(data, {
      get(target, prop) {
        const value = target[prop as keyof typeof target];

        // Check if this is an activity item (e.g., based on a type field)
        const isActivity = target.hasOwnProperty("activityId");
        const isURLAttachment = target.hasOwnProperty("tutorials");

        // Exclude "description" only if it's NOT an activity item OR a urlAttachment item
        if (typeof prop === 'string' && excludeKeys.includes(prop) && !(isActivity && prop === "description") && !(isURLAttachment && (prop === "description" || prop === "url"))) {
          return undefined;
        }
        return typeof value === "object" && value !== null
          ? createFilteredProxy(value, excludeKeys)
          : value;
      }
    });
  }
  return data;
};


// Given a unit to be downloaded, remove the format fields such as "PLT", "ILT", "IST" from each activity
const removeFormatTags = (unit: Unit) => {
  // Quick helper method:
  const filterActivitiesArray = (activity: Activity) => {
    const activityClone = structuredClone(activity);
    delete activityClone['isILT'];
    delete activityClone['isIST'];
    delete activityClone['isPLT'];
    return activityClone;
  }
  // unit:
  unit.unitActivities = unit.unitActivities?.map(filterActivitiesArray)

  //modules and topics:
  for (let i = 0; i < unit.modules.length; i++) {
    unit.modules[i].moduleActivities = unit.modules[i].moduleActivities?.map(filterActivitiesArray);
    for (let j = 0; j < unit.modules[i].topics.length; j++) {
      unit.modules[i].topics[j].topicActivities = unit.modules[i].topics[j].topicActivities?.map(filterActivitiesArray);
    }
  }
  return unit;
}



function UnitDisplay() {
  // This state represents the entire unit that we are working on
  // Including modules, topics, activities, and the associated fields:
  const [unitTaxonomy, setUnitTaxonomy] = useState<Unit>();
  // This represents the current activity type that we are editing
  const [currentEdit, setCurrentEdit] = useState<HierarchyItem>({ title: '', id: '' });
  // Represents whether we are currently updating an activity (true) or adding a new one
  const [updateMode, setUpdateMode] = useState<boolean>(false);
  // This state represents the current activity that we are updating:
  const [activityFocused, setActivityFocused] = useState<Activity>();

  const previewData = useMemo(() => createFilteredProxy(unitTaxonomy), [unitTaxonomy]);



  // Handle JSON uploads and update state accordingly
  // Also, initialize each hierarchy item to have an empty list of activities
  const uploadJSONHandler = (data: string) => {
    const dataParsed = JSON.parse(data);

    dataParsed.unitActivities = [];
    for (let i = 0; i < dataParsed.modules.length; i++) {
      dataParsed.modules[i].moduleActivities = [];
      for (let j = 0; j < dataParsed.modules[i].topics.length; j++) {
        dataParsed.modules[i].topics[j].topicActivities = [];
      }
    }

    setUnitTaxonomy(dataParsed);
  }

  // When we click on a hierarchy item or activity, we set the edit window to target that item:
  const onClickHandler = (currentEdit_: HierarchyItem, updateMode_: boolean, activity?: Activity) => {
    console.log(updateMode_)
    setCurrentEdit(currentEdit_);
    setUpdateMode(updateMode_);
    console.log(activity);
    if(activity) setActivityFocused(activity);

  }

  // Given an activity and an associated hierarchy item (unit/module/topic), add the activity:
  const upsertActivityHandler = (activityDetails: Activity, hierarchyType: HierarchyType, id: string) => {
    if (!unitTaxonomy) return;
    let taxonomy = structuredClone(unitTaxonomy);
    switch (hierarchyType) {
      case HierarchyType.UNIT:
        taxonomy = addActivityToUnit(taxonomy, activityDetails, id);
        break;
      case HierarchyType.MODULE:
        taxonomy = addActivityToModule(taxonomy, activityDetails, id);
        break;
      case HierarchyType.TOPIC:
        taxonomy = addActivityToTopic(taxonomy, activityDetails, id);
        break;
    }
    setUnitTaxonomy(taxonomy);
  }

  // Separate methods for adding to unit, module, and topic
  // add activity to given unit (designated by id paramter)
  const addActivityToUnit = (taxonomy: Unit, activityDetails: Activity, unitId: string) => {
    activityDetails.unitId = unitId
    let activities = taxonomy.unitActivities;
    if (!activities) return taxonomy;
    if (taxonomy.id === unitId) {
      // If we are updating this activity:
      if (updateMode) {
        for (let i = 0; i < activities.length; i++) {
          if (activities[i].activityId === activityDetails.activityId) {
            activities[i] = activityDetails;
            alert('Activity updated!');
            break;
          }
        }
      }
      else {
        if (!checkActivityExists(activityDetails, activities!)) taxonomy.unitActivities?.push(activityDetails);
        else alert('Duplicate Activity Name + Type')
      }
    }
    return taxonomy;
  }

  // add activity to given module (designated by id parameter)
  const addActivityToModule = (taxonomy: Unit, activityDetails: Activity, moduleId: string) => {
    activityDetails.moduleId = moduleId
    for (let i = 0; i < taxonomy?.modules.length; i++) {
      if (taxonomy?.modules[i].id === moduleId) {
        let activities = taxonomy.modules[i].moduleActivities;
        if (!activities) return taxonomy;
        if (updateMode) {
          for (let i = 0; i < activities.length; i++) {
            if (activities[i].activityId === activityDetails.activityId) {
              activities[i] = activityDetails;
              alert('Activity updated!');
              break;
            }
          }
        }
        else {
          if (!checkActivityExists(activityDetails, activities!)) taxonomy.modules[i].moduleActivities?.push(activityDetails);
          else alert('Duplicate Activity Name + Type');
        }
        break;
      }
    }
    return taxonomy;
  }

  // add activity to given module (designated by id parameter)
  const addActivityToTopic = (taxonomy: Unit, activityDetails: Activity, topicId: string) => {
    activityDetails.topicId = topicId
    for (let i = 0; i < taxonomy?.modules.length; i++) {
      for (let j = 0; j < (taxonomy?.modules[i].topics?.length || 0); j++) {
        if (taxonomy.modules[i].topics[j].id === topicId) {
          let activities = taxonomy.modules[i].topics[j].topicActivities;
          if (!activities) return taxonomy;
          if (updateMode) {
            for (let i = 0; i < activities.length; i++) {
              if (activities[i].activityId === activityDetails.activityId) {
                activities[i] = activityDetails;
                alert('Activity updated!');
                break;
              }
            }
          } else {
            if (!checkActivityExists(activityDetails, activities!)) taxonomy.modules[i].topics[j].topicActivities?.push(activityDetails);
            else alert('Duplicate Activity Name + Type');
          }
          return taxonomy;
        }
      }
    }
    return taxonomy;
  }



  // Call the downloadTaxonomy functions for each format (ILT, PLT, IST)
  const downloadTaxonomyAllFormats = () => {
    downloadTaxonomyOneFormat('isILT', 'IN03');
    downloadTaxonomyOneFormat('isIST', 'IN02')
    downloadTaxonomyOneFormat('isPLT', 'IN01')
  }

  // download the format file for one specific format:
  const downloadTaxonomyOneFormat = (key: activityKey, code: string) => {
    if (!unitTaxonomy) return;
    // only grab activities for the designated format:
    let dataFiltered: Unit = filterActivitiesByFormat(structuredClone(JSON.parse(JSON.stringify(previewData, null, 2))), key);

    // TODO: remove unwanted fields (isPLT, isILT, etc.)
    dataFiltered = removeFormatTags(dataFiltered);

    dataFiltered.code = code;
    dataFiltered.version = "v1.0";
    dataFiltered.name = dataFiltered.title;

    const fileData = JSON.stringify(dataFiltered);
    // create a blob and remove all unnecessary fields
    const blob = new Blob([createFilteredProxy(fileData)], { type: 'text/json' });
    const url = URL.createObjectURL(blob);
    const linkElement = document.createElement('a');
    linkElement.download = `${unitTaxonomy?.title}-taxonomy-${key.substring(2)}.json`;
    linkElement.href = url;
    linkElement.click();
  }

  // given a unit and a key, only keep those activities where the key evaluates to true
  // example usage: filterActivitesByFormat(data, 'isPLT') -- would only keep PLT activities:
  const filterActivitiesByFormat = (data: Unit, key: activityKey) => {
    // Unit Level
    data.unitActivities = data.unitActivities?.filter((activity: Activity) => activity[key])

    // Module Level
    for (let i = 0; i < data.modules.length; i++) {
      data.modules[i].moduleActivities = data.modules[i].moduleActivities?.filter(activity => activity[key])
    }

    // Topic Level
    for (let i = 0; i < data.modules.length; i++) {
      for (let j = 0; j < data.modules.length; j++) {
        data.modules[i].topics[j].topicActivities = data.modules[i].topics[j].topicActivities?.filter(activity => activity[key])
      }
    }
    return data;
  };






  return (

    unitTaxonomy ?

      (<div className='ml-12 my-6  bg-white rounded-lg shadow-md  flex justify-around'>


        <div className=' h-[90vh] w-[50%] overflow-auto'>
          {unitTaxonomy &&
            <div className='unit w-50'>
              <h1 className='unit-title font-bold'>{unitTaxonomy.title} (Unit)</h1>
              <h2 className='font-bold'>Activities:</h2>
              <ul className="max-w-md space-y-1 list-disc list-inside">
                {unitTaxonomy.unitActivities?.map((activity: Activity) =>
                  <li className='activity' key={activity.activityName + activity.activityType}>
                    <button className='cursor-pointer' onClick={() => onClickHandler({ hierarchyType: HierarchyType.UNIT, title: unitTaxonomy.title, id: unitTaxonomy.id }, true, activity)}>{activity.activityName} ({activity.activityType})</button>
                  </li>
                )}
              </ul>
              <button className="mt-2 m-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-blue-500 
                text-white font-semibold rounded-lg shadow-lg transform text-center
                transition duration-300 ease-in-out hover:scale-105 hover:shadow-2xl mx-auto 
                focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer mb-8" onClick={() => onClickHandler({ hierarchyType: HierarchyType.UNIT, title: unitTaxonomy.title, id: unitTaxonomy.id }, false)}>Add Activity (Unit Level)</button>

              {unitTaxonomy.modules.map(module =>
                <div className='module bg-gray-300 mb-5 p-4 rounded-xl' key={module.id}>
                  <h3 className='module-title font-bold'>{module.title} (Module)</h3>
                  <ul className="max-w-md space-y-1 list-disc list-inside">
                    {module.moduleActivities?.map((activity: Activity) =>
                      <li key={activity.activityName + activity.activityType}>
                        <button className='cursor-pointer' onClick={() => onClickHandler({ hierarchyType: HierarchyType.MODULE, title: module.title, id: module.id }, true, activity)} >{activity.activityName} ({activity.activityType})</button>
                      </li>
                    )}
                  </ul>
                  <button className="mt-2 m-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-blue-500 
                  text-white font-semibold rounded-lg shadow-lg transform text-center
                  transition duration-300 ease-in-out hover:scale-105 hover:shadow-2xl mx-auto 
                  focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer mb-8"onClick={() => onClickHandler({ hierarchyType: HierarchyType.MODULE, title: module.title, id: module.id }, false)}>Add Activity (Module Level)</button>

                  {module.topics.map(topic =>
                    <div className='topic bg-gray-200 mb-5 p-3 rounded-xl' key={topic.id}>
                      <p className='topic-title text-xl font-bold'>{topic.title} (Topic)</p>
                      <ul className="max-w-md space-y-1 list-disc list-inside ">
                        {topic.topicActivities?.map((activity: Activity) =>
                          <li key={activity.activityName + activity.activityType}>
                            <button className='cursor-pointer' onClick={() => onClickHandler({ hierarchyType: HierarchyType.TOPIC, title: topic.title, id: topic.id }, true, activity)}>
                              {activity.activityName} ({activity.activityType})
                            </button>
                          </li>
                        )}
                      </ul>
                      <button className="mt-2 m-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-blue-500 
                      text-white font-semibold rounded-lg shadow-lg transform text-center
                      transition duration-300 ease-in-out hover:scale-105 hover:shadow-2xl mx-auto 
                      focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer" onClick={() => onClickHandler({ hierarchyType: HierarchyType.TOPIC, title: topic.title, id: topic.id }, false)}>Add Activity (Topic Level)</button>
                    </div>
                  )}
                </div>

              )}
            </div>
          }
        </div>

        <div className="add-activity">
          <AddActivity hierarchyItem={currentEdit} upsertActivityFunc={upsertActivityHandler} updateMode={updateMode} activityProp={activityFocused} />

          <h2 className="text-2xl font-semibold text-center mb-4 mt-5">Preview of Unit:</h2>
          <button
            onClick={downloadTaxonomyAllFormats}
            className="block  py-3 px-6 bg-gradient-to-r from-indigo-600 to-blue-500 
            text-white font-semibold rounded-lg shadow-lg transform text-center
            transition duration-300 ease-in-out hover:scale-105 hover:shadow-2xl mx-auto 
            focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"



          >Download (3 Files)</button>

          <pre className="bg-white-800  m-auto text-blue-950 p-6 rounded-lg shadow-xl font-mono text-sm whitespace-pre-wrap ">
            {JSON.stringify(previewData, null, 2)}
          </pre>



        </div>


      </div>)

      :

      <UploadJSON onFileRead={uploadJSONHandler}></UploadJSON>




  )

}

export default UnitDisplay;