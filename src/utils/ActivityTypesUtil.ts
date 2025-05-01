const activityToCodeMap: Record<string, string> = {
  "Exam": "ACT003",
  "Lesson - Video": "ACT0061",
  "Lesson - Learning Content": "ACT0062",
  "Lesson - Live Lecture": "ACT0063",
  "Reference": "ACT007",
  "Lab - Coding Lab": "ACT0081",
  "Lab - Coding Challenge": "ACT0082",
  "Lab - Mini Project": "ACT0083",
  "Self Study": "ACT012",
  "Office Hours": "ACT013",
  "Assignment": "ACT009"
}

export const getActivityCode = (activity: string): string => {
  const code = activityToCodeMap[activity]
  if (!code) {
    alert("Activity code not found for activity: " + activity)
    throw new Error(`Activity code not found for activity: ${activity}`)
  }
  return code
}

const ISTActivityTypes = ["Lesson - Learning Content", "Lesson - Live Lecture", "Assignment", "Lab - Coding Lab", "Lab - Mini Project", "Lab - Coding Challenge", "Self Study", "Office Hours"];
const ISTReviewTypes   = ["Lesson - Learning Content", "Lesson - Live Lecture", "Assignment", "Lab - Coding Lab", "Lab - Mini Project", "Lab - Coding Challenge"]
const PLTActivityTypes = ["Reference", "Lesson - Video"]
const PLTReviewTypes   = ["Reference", "Lesson - Video"]

export const setFormatBooleans = (activity: any) => {
  // All activities are included in ILT:
  activity.isILT = true

  // IST includes a sub-set of activities, use arrays to determine type
  activity.isIST = ISTActivityTypes.includes(activity.activityType) || 
    (activity.isReview && ISTReviewTypes.includes(activity.activityType));

  // Activity is in PLT if it is in IST or Reference/Video
  activity.isPLT = activity.isIST || PLTActivityTypes.includes(activity.activityType) ||
    (activity.isReview && PLTReviewTypes.includes(activity.activityType));
}