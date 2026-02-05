import { formatKey, Unit } from "../types";
import { IDsGeneratorRandom } from "./IDsGenerator";
/**
 * These helper methods are used to manage the different formats for a given unit including.
 * Specifically, we are finalizing the data to be written to the format files
 * - Removing format booleans since they shouldn't be in the downloaded artifacts
 * - Determining which activities to add to a given format file
 */


/**
 * Remove all instances of the isILT, isIST, isPLT fields from activities since we do NOT
 * want them to show up in the final artifacts
 * @param unit the unit to "clean up"
 * @returns the "cleaned up" unit
 */
const removeFormatTags = (unit: any) => {
  // quick helper method:
  const filterActivitiesArray = (activity: any) => {
    const activityClone = structuredClone(activity);
    delete activityClone['isILT'];
    delete activityClone['isIST'];
    delete activityClone['isPLT'];
    return activityClone;
  }
  
  // Do this for all unit, module, and topic activities:
  unit.unitActivities = unit.unitActivities?.map(filterActivitiesArray);
  for (let i = 0; i < unit.modules.length; i++) {
    unit.modules[i].moduleActivities = unit.modules[i].moduleActivities?.map(filterActivitiesArray);
    for (let j = 0; j < unit.modules[i].topics.length; j++) {
      unit.modules[i].topics[j].topicActivities = unit.modules[i].topics[j].topicActivities?.map(filterActivitiesArray);
    }
  }
  return unit;
}

/**
 * Prepares the data to be downloaded for the format files by calling the individual 
 * helper method 3 times (once for each format type)
 * @param unit the unit in question
 * @param activityIds existing activity Ids
 * @returns the format files to be downloaded
 */
const prepFormatFiles = (unit: Unit, activityIds: any) => {
  let data1 = prepFormatFile('isILT', unit, activityIds);
  let data2 = prepFormatFile('isIST', unit, activityIds);
  let data3 = prepFormatFile('isPLT', unit, activityIds);

  let unfoundActivities = [...data1!.unfoundActivities, ...data2!.unfoundActivities, ...data3!.unfoundActivities];
  if (unfoundActivities.length > 0) {
    console.warn(`Warning: The following activities were not found in the ID mapping and have been assigned random IDs: ${unfoundActivities.join(', ')}`);
    alert(`Some activities were not found in the ID mapping and have been assigned random IDs. Please check the console for details.`);
  }
  return {
    'ILTFormatFile': data1?.taxonomy,
    'ISTFormatFile': data2?.taxonomy,
    'PLTFormatFile': data3?.taxonomy,
  }
}

/**
 * Finalize the content to be downloaded for a given format
 * @param key the format in question
 * @param unitTaxonomy representation of the unit
 * @param activityIds 
 * @returns 
 */
const prepFormatFile = (key: formatKey, unitTaxonomy: Unit, activityIds: any) => {
  if (!unitTaxonomy) return;
  // only grab activities for the designated format:
  let data: any = filterActivitiesByFormat(structuredClone(JSON.parse(JSON.stringify(unitTaxonomy, null, 2))), key, activityIds);
  let dataFiltered = data.data;
  let unfoundActivities = data.unfound;

  // Remove unwanted fields (isPLT, isILT, etc.)
  dataFiltered = removeFormatTags(dataFiltered);

  // Finalize some meta-data:
  let formatToCode = {'isILT': 'IN03', 'isIST': 'INO2', 'isPLT': 'IN01'}
  dataFiltered.code = formatToCode[key];
  dataFiltered.version = "v1.0";
  dataFiltered.name = dataFiltered.title;

  return {taxonomy: dataFiltered, unfoundActivities};
}

// 
/**
 * Given a unit and a format key, only keep those activities where the key evaluates to true
 * So, if we pass in a unit and "isPLT", the returned unit will only contain PLT activities
 * @param unit the unit in question
 * @param key format key
 * @param activityIds existing activity Ids
 * @returns 
 */
const filterActivitiesByFormat = (unit: Unit, key: formatKey, activityIds: any) => {
  let unfound:any = [];
  const format = key.slice(-3).toUpperCase();
  // Unit Level
  unit.unitActivities = unit.unitActivities?.filter((activity: any) => activity[key])
  unit.unitActivities = unit.unitActivities?.map((activity: any) => {
    let newId = activityIds[activity.activityName + format];
    if(!newId) {
        unfound.push(activity.activityName + format);
        newId = IDsGeneratorRandom();
    }
    activity.activityId = newId;
    return activity;
  });

  // Module Level
  for (let i = 0; i < unit.modules.length; i++) {
    unit.modules[i].moduleActivities = unit.modules[i].moduleActivities?.filter((activity: any) => activity[key]);
    unit.modules[i].moduleActivities = unit.modules[i].moduleActivities?.map((activity: any) => {
      activity.activityId = activityIds[activity.activityName + format] || IDsGeneratorRandom();
      return activity;
    });
  }

  // Topic Level
  for (let i = 0; i < unit.modules.length; i++) {
    for (let j = 0; j < unit.modules[i].topics.length; j++) {
      unit.modules[i].topics[j].topicActivities = unit.modules[i].topics[j].topicActivities?.filter((activity: any) => activity[key])
      unit.modules[i].topics[j].topicActivities = unit.modules[i].topics[j].topicActivities?.map((activity: any) => {
        activity.activityId = activityIds[activity.activityName + format] || IDsGeneratorRandom();
        return activity;
      });
    }
  }
  return {data: unit, unfound}
};


export { removeFormatTags, prepFormatFiles, prepFormatFile, filterActivitiesByFormat };