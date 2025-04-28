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
  "Office Hours": "ACT013"
}

export const getActivityCode = (activity: string): string => {
  const code = activityToCodeMap[activity]
  if (!code) {
    alert("Activity code not found for activity: " + activity)
    throw new Error(`Activity code not found for activity: ${activity}`)
  }
  return code
}

const commonPLTTypes = ['ACT002', 'ACT003', 'ACT004', 'ACT0041', 'ACT0042', 'ACT005', 'ACT0061', 'ACT0062', 'ACT0063', 'ACT007', 'ACT0081', 'ACT0082', 'ACT0083', 'ACT009', 'ACT012', 'ACT013']
const commonILTTypes = ['ACT001', 'ACT002', 'ACT003', 'ACT004', 'ACT0041', 'ACT005', 'ACT0063', 'ACT007', 'ACT0081', 'ACT0082', 'ACT0083', 'ACT009', 'Project -> Kick Off']
const commonISTTypes = ['ACT002', 'ACT003', 'ACT004', 'ACT0041', 'ACT0042', 'ACT005', 'ACT0061', 'ACT0062', 'ACT0063', 'ACT007', 'ACT0081', 'ACT0082', 'ACT0083', 'ACT009', 'ACT012', 'ACT013']


export const setFormatBooleans = (activity: any) => {
  activity.isPLT = commonPLTTypes.includes(activity.type)
  activity.isILT = commonILTTypes.includes(activity.type)
  activity.isIST = commonISTTypes.includes(activity.type)
  activity.isPLT = activity.isPLT || activity.isILT || activity.isIST
  activity.isILT = activity.isILT || activity.isIST
  return activity
}