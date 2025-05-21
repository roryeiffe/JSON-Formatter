import { IDsGeneratorRandom } from "./IDsGenerator";

type activityKey = "isILT" | "isIST" | "isPLT";

// Given a unit to be downloaded, remove the format fields such as "PLT", "ILT", "IST" from each activity
const removeFormatTags = (unit: any) => {
  // Quick helper method:
  const filterActivitiesArray = (activity: any) => {
    const activityClone = structuredClone(activity);
    delete activityClone['isILT'];
    delete activityClone['isIST'];
    delete activityClone['isPLT'];
    return activityClone;
  }
  // unit:
  unit.unitActivities = unit.unitActivities?.map(filterActivitiesArray);

  //modules and topics:
  for (let i = 0; i < unit.modules.length; i++) {
    unit.modules[i].moduleActivities = unit.modules[i].moduleActivities?.map(filterActivitiesArray);
    for (let j = 0; j < unit.modules[i].topics.length; j++) {
      unit.modules[i].topics[j].topicActivities = unit.modules[i].topics[j].topicActivities?.map(filterActivitiesArray);
    }
  }
  return unit;
}

// Call the downloadTaxonomy functions for each format (ILT, PLT, IST)
const downloadTaxonomyAllFormats = (unit: any) => {
  return {
    'ILTFormatFile': downloadTaxonomyOneFormat('isILT', 'IN03', unit),
    'ISTFormatFile': downloadTaxonomyOneFormat('isIST', 'IN02', unit),
    'PLTFormatFile': downloadTaxonomyOneFormat('isPLT', 'IN01', unit),
  }
}

// download the format file for one specific format:
const downloadTaxonomyOneFormat = (key: activityKey, code: string, unitTaxonomy: any) => {
  if (!unitTaxonomy) return;
  // only grab activities for the designated format:
  let dataFiltered: any = filterActivitiesByFormat(structuredClone(JSON.parse(JSON.stringify(unitTaxonomy, null, 2))), key);

  // TODO: remove unwanted fields (isPLT, isILT, etc.)
  dataFiltered = removeFormatTags(dataFiltered);

  dataFiltered.code = code;
  dataFiltered.version = "v1.0";
  dataFiltered.name = dataFiltered.title;

  return dataFiltered;
}

// given a unit and a key, only keep those activities where the key evaluates to true
// example usage: filterActivitesByFormat(data, 'isPLT') -- would only keep PLT activities:
const filterActivitiesByFormat = (data: any, key: activityKey) => {
  // Unit Level
  data.unitActivities = data.unitActivities?.filter((activity: any) => activity[key])
  data.unitActivities = data.unitActivities?.map((activity: any) => {
    activity.activityId = IDsGeneratorRandom();
    return activity;
  });

  // Module Level
  for (let i = 0; i < data.modules.length; i++) {
    data.modules[i].moduleActivities = data.modules[i].moduleActivities?.filter((activity: any) => activity[key]);
    data.modules[i].moduleActivities = data.modules[i].moduleActivities?.map((activity: any) => {
      activity.activityId = IDsGeneratorRandom();
      return activity;
    });
  }

  // Topic Level
  for (let i = 0; i < data.modules.length; i++) {
    for (let j = 0; j < data.modules[i].topics.length; j++) {
      data.modules[i].topics[j].topicActivities = data.modules[i].topics[j].topicActivities?.filter((activity: any) => activity[key])
      data.modules[i].topics[j].topicActivities = data.modules[i].topics[j].topicActivities?.map((activity: any) => {
        activity.activityId = IDsGeneratorRandom();
        return activity;
      });
    }
  }
  console.log(data);
  return data;
};


export { removeFormatTags, downloadTaxonomyAllFormats, downloadTaxonomyOneFormat, filterActivitiesByFormat };