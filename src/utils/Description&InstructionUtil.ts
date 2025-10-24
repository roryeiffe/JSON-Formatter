// make map of activity types to generic description and instructions:
const activityTypeToDescriptionMap: Record<string, string> = {
  "Lesson - Video": "This video covers concepts related to <UNIT-NAME>",
  "Lesson - Learning Content": "This written lesson covers concepts related to <UNIT-NAME>",
  "Lesson - Live Lecture": "During this live lecture, your Revature trainer will discuss concepts related to <UNIT-NAME>",
  "Reference": "Please review this additional resource, which is aimed to enhance your understanding of concepts related to <UNIT-NAME>.",
  "Lab - Coding Lab": "This coding lab will give you a chance to practice your coding skills",
  "Lab - Coding Challenge": "This coding challenge will give you a chance to hone your coding and problem solving skills. You may need to review other resources to solve this activity.",
  "Lab - Mini Project": "This mini project will give you a chance to hone your coding skills in a real-world simulation",
  "Self Study": "During this self-study session, you have the freedom to guide your own learning and practice on your own",
  "Office Hours": "During this office hour session, you can ask questions and get help from your trainer or peers",
  "Assignment": "This activity will give you a chance to get hands-on practice"
}

// make map of activity types to generic description and instructions:
const activityTypeToDescriptionMapReview: Record<string, string> = {
  "Lesson - Video": "This video covers previously covered concepts related to <UNIT-NAME>",
  "Lesson - Learning Content": "This written lesson covers previously covered concepts related to <UNIT-NAME>",
  "Lesson - Live Lecture": "During this live lecture, your Revature trainer will discuss previously covered concepts related to <UNIT-NAME>",
  "Reference": "Please review this additional resource, which is aimed to enhance your understanding of previously covered concepts related to <UNIT-NAME>.",
  "Lab - Coding Lab": "This coding lab will give you a chance to review your coding skills on previously covered concepts",
  "Lab - Coding Challenge": "This coding challenge will give you a chance to further practice your coding and problem solving skills. You may need to review other resources to solve this activity.",
  "Lab - Mini Project": "This mini project will give you a chance to review the concepts learned in a real-world simulation",
  "Self Study": "During this self-study session, you have the freedom to guide your own learning and practice on your own",
  "Office Hours": "During this office hour session, you can ask questions and get help from your trainer or peers",
  "Assignment": "This activity will give you a chance to review previously covered concepts and get hands-on practice"
}

const activityTypeToInstructionMap: Record<string, string> = {
  "Lesson - Video": "Watch the video lesson. Jot down notes and questions as you go.",
  "Lesson - Learning Content": "Read the lesson content. If applicable, try out some of the coding examples on your own.",
  "Lesson - Live Lecture": "Attend the live lecture. Take notes and ask questions if you have any.",
  "Reference": "Read the reference material. Take notes on important concepts and examples.",
  "Lab - Coding Lab": "Complete the coding lab. Use the provided instructions and examples to guide you.",
  "Lab - Coding Challenge": "Complete the coding challenge. Use the provided instructions and examples to guide you.",
  "Lab - Mini Project": "Complete the mini project. Use the provided instructions and examples to guide you. Ask questions if you have any.",
  "Self Study": "Study the material on your own. Take notes and ask your peers any questions that come up.",
  "Office Hours": "Attend the office hours session. Ask questions and get help from trainers or peers.",
  "Assignment": "Complete the assignment. Use the provided instructions and examples to guide you."
}

export const updateActivityDescriptionAndInstructions = (activity: any, unitName: string) => {
  // Set description and instructions based on activity type
  let description: string | undefined;
  if( activity.isReview ) description = activityTypeToDescriptionMapReview[activity.activityType]
  else description = activityTypeToDescriptionMap[activity.activityType]

  const instructions = activityTypeToInstructionMap[activity.activityType]

  if (description) {
    activity.description = description.replace("<UNIT-NAME>", unitName)
  } else {
    console.warn(`No description found for activity type: ${activity.activityType}`)
  }

  if (instructions) {
    activity.instruction = instructions.replace("<UNIT-NAME>", unitName)
  } else {
    console.warn(`No instructions found for activity type: ${activity.activityType}`)
  }

  // remove activityURL if activityPath is present
    if (activity.activityPath) {
      activity.activityURL = '';
    }
}