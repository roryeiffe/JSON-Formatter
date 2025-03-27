import React, { useState, useEffect, useMemo, act } from "react";

import { Activity, HierarchyItem, HierarchyType, Unit } from "../types";
import './UnitDisplay.css';

import AddActivity from "./AddActivity";
import UploadJSON from "./UploadJSON";

type activityKey = "isILT" | "isIST" | "isPLT";

// Ensure that an activity with the same name and type does not exist in the array 
// to which we are trying to push a new activity
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
const createFilteredProxy: any = (data: Unit, excludeKeys = ["id", "prerequisites", "description", "tooltip", "url"]) => {
  if (Array.isArray(data)) {
    return data.map(item => createFilteredProxy(item, excludeKeys));
  } else if (typeof data === "object" && data !== null) {
    return new Proxy(data, {
      get(target, prop) {
        if (typeof prop === 'string' && excludeKeys.includes(prop)) return undefined;
        const value = target[prop as keyof typeof target];
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
  const filterActivitiesArray = (activity:Activity) => ({
    activityId: activity.activityId,
    activityName: activity.activityName,
    activityPath: activity.activityPath,
    activityType: activity.activityType
  })
  // unit:
  unit.activities = unit.activities?.map(filterActivitiesArray)

  //modules and topics:
  for(let i = 0; i < unit.modules.length; i ++) {
    unit.modules[i].activities = unit.modules[i].activities?.map(filterActivitiesArray);
    for(let j = 0; j < unit.modules[i].topics.length; j ++) {
      unit.modules[i].topics[j].activities = unit.modules[i].topics[j].activities?.map(filterActivitiesArray);
    }
  }

  return unit;
}


function UnitDisplay() {
  const [unitTaxonomy, setUnitTaxonomy] = useState<Unit>();
  const [currentEdit, setCurrentEdit] = useState<HierarchyItem>({ title: '', id: '' });

  const previewData = useMemo(() => createFilteredProxy(unitTaxonomy), [unitTaxonomy]);



  // Handle JSON uploads and update state accordingly
  // Also, initialize each hierarchy item to have an empty list of activities
  const uploadJSONHandler = (data: string) => {
    const dataParsed = JSON.parse(data);

    dataParsed.activities = [];
      for (let i = 0; i < dataParsed.modules.length; i++) {
        dataParsed.modules[i].activities = [];
        for (let j = 0; j < dataParsed.modules[i].topics.length; j++) {
          dataParsed.modules[i].topics[j].activities = [];
        }
      }

    setUnitTaxonomy(dataParsed);
  }

  // Given an activity and an associated hierarchy item (unit/module/topic), add the activity:
  const addActivityHandler = (activityDetails: Activity, hierarchyType: HierarchyType, id: string) => {
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
  const addActivityToUnit = (taxonomy: Unit, activityDetails: Activity, id: string) => {
    let activities = taxonomy.activities;
    if (taxonomy.id === id) {
      console.log("Got here");
      if (!checkActivityExists(activityDetails, activities!)) taxonomy.activities?.push(activityDetails);
      else alert('Duplicate Activity Name + Type')
    }
    return taxonomy;
  }

  // add activity to given module (designated by id parameter)
  const addActivityToModule = (taxonomy: Unit, activityDetails: Activity, id: string) => {
    for (let i = 0; i < taxonomy?.modules.length; i++) {
      if (taxonomy?.modules[i].id === id) {
        let activities = taxonomy.modules[i].activities;
        if (!checkActivityExists(activityDetails, activities!)) taxonomy.modules[i].activities?.push(activityDetails);
        else alert('Duplicate Activity Name + Type');
        break;
      }
    }
    return taxonomy;
  }

  // add activity to given module (designated by id parameter)
  const addActivityToTopic = (taxonomy: Unit, activityDetails: Activity, id: string) => {
    for (let i = 0; i < taxonomy?.modules.length; i++) {
      for (let j = 0; j < (taxonomy?.modules[i].topics?.length || 0); j++) {
        if (taxonomy.modules[i].topics[j].id === id) {
          let activities = taxonomy.modules[i].topics[j].activities;
          if (!checkActivityExists(activityDetails, activities!)) taxonomy.modules[i].topics[j].activities?.push(activityDetails);
          else alert('Duplicate Activity Name + Type');
          return taxonomy;
        }
      }
    }
    return taxonomy;
  }



  const downloadTaxonomyAllFormats = () => {
    downloadTaxonomyOneFormat('isILT', 'IN03');
    downloadTaxonomyOneFormat('isIST', 'IN02')
    downloadTaxonomyOneFormat('isPLT', 'IN01')
  }

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

  const filterActivitiesByFormat = (data:Unit, key:activityKey) => {
    // Unit Level
    data.activities = data.activities?.filter((activity:Activity) => activity[key])

    // Module Level
    for(let i = 0; i < data.modules.length; i ++) {
      data.modules[i].activities = data.modules[i].activities?.filter(activity => activity[key])
    }

    // Topic Level
    for(let i = 0; i < data.modules.length; i ++) {
      for(let j = 0; j < data.modules.length; j ++) {
        data.modules[i].topics[j].activities = data.modules[i].topics[j].activities?.filter(activity => activity[key])
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
                {unitTaxonomy.activities?.map((activity: Activity) =>
                  <li key={activity.activityName + activity.activityType}>{activity.activityName} ({activity.activityType})</li>
                )}
              </ul>
              <button className="mt-2 m-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-blue-500 
                text-white font-semibold rounded-lg shadow-lg transform text-center
                transition duration-300 ease-in-out hover:scale-105 hover:shadow-2xl mx-auto 
                focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer mb-8" onClick={() => setCurrentEdit({ hierarchyType: HierarchyType.UNIT, title: unitTaxonomy.title, id: unitTaxonomy.id })}>Add Activity (Unit Level)</button>

              {unitTaxonomy.modules.map(module =>
                <div className='module bg-gray-300 mb-5 p-4 rounded-xl' key={module.id}>
                  <h3 className='module-title font-bold'>{module.title} (Module)</h3>
                  <ul className="max-w-md space-y-1 list-disc list-inside">
                    {module.activities?.map((activity: Activity) =>
                      <li key={activity.activityName + activity.activityType}>{activity.activityName} ({activity.activityType})</li>
                    )}
                  </ul>
                  <button className="mt-2 m-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-blue-500 
                  text-white font-semibold rounded-lg shadow-lg transform text-center
                  transition duration-300 ease-in-out hover:scale-105 hover:shadow-2xl mx-auto 
                  focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer mb-8"onClick={() => setCurrentEdit({ hierarchyType: HierarchyType.MODULE, title: module.title, id: module.id })}>Add Activity (Module Level)</button>

                  {module.topics.map(topic =>
                    <div className='topic bg-gray-200 mb-5 p-3 rounded-xl' key={topic.id}>
                      <p className='topic-title text-xl font-bold'>{topic.title} (Topic)</p>
                      <ul className="max-w-md space-y-1 list-disc list-inside ">
                        {topic.activities?.map((activity: Activity) =>
                          <li key={activity.activityName + activity.activityType}>{activity.activityName} ({activity.activityType})</li>
                        )}
                      </ul>
                      <button className="mt-2 m-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-blue-500 
                      text-white font-semibold rounded-lg shadow-lg transform text-center
                      transition duration-300 ease-in-out hover:scale-105 hover:shadow-2xl mx-auto 
                      focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer" onClick={() => setCurrentEdit({ hierarchyType: HierarchyType.TOPIC, title: topic.title, id: topic.id })}>Add Activity (Topic Level)</button>
                    </div>
                  )}
                </div>

              )}
            </div>
          }
        </div>

        <div className="add-activity">
          <AddActivity hierarchyItem={currentEdit} addActivityFunc={addActivityHandler} />

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