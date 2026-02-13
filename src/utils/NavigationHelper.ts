import { EMPTY_NAVIGATION_JSON } from "./Constants";
import { ExitCriteriaRow, MetadataRow, NavigationJson, Unit } from "../types";

/**
 * Given information from the excel, construct the navigation.json
 * @param taxonomy_json 
 * @param exit_criteria_json 
 * @param metadata_json 
 * @returns 
 */
export const generate_navigation_json = async (taxonomy_json: Unit, exit_criteria_json: ExitCriteriaRow[], metadata_json: MetadataRow[]) => {
  // Initialize:
  let navigation_json: NavigationJson =
  {
    ...structuredClone(taxonomy_json),
    ...EMPTY_NAVIGATION_JSON,
    skill: taxonomy_json.title
  };

  navigation_json.duration = getTotalDuration(navigation_json);

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

  // Remove Activities (don't need them in navigation.json)
  delete navigation_json.unitActivities; // Remove activities from navigation_json to avoid duplication
  for (const module of navigation_json.modules) {
    delete module.moduleActivities; // Remove activities from each module
    for (const topic of module.topics) {
      delete topic.topicActivities; // Remove activities from each topic
    }
  }

  return navigation_json;
};


/**
 * Given a unit representation, return the total duration of all activities:
 * @param navigation_json 
 * @returns duration, in minutes of all activities
 */
const getTotalDuration = (navigation_json: Unit): number => {
  let totalDuration = 0;
  for (const activity of navigation_json.unitActivities!) {
    totalDuration += activity.duration || 0;
  }
  for (const module of navigation_json.modules) {
    for (const activity of module.moduleActivities!) {
      totalDuration += activity.duration || 0;
    }
    for (const topic of module.topics) {
      for (const activity of topic.topicActivities!) {
        totalDuration += activity.duration || 0;
      }
    }
  }
  return totalDuration;
}

