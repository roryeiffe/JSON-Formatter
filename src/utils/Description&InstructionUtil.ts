// make map of activity types to generic description and instructions:
const activityTypeToDescriptionMap: Record<string, string> = {
  "Exam": "An exam that assesses you on <UNIT-NAME>",
  "Lesson - Video": "A video lesson that covers certain topics from <UNIT-NAME>",
  "Lesson - Learning Content": "A written lesson that contains information about topic(s) in <UNIT-NAME>, including description, examples, and a summary",
  "Lesson - Live Lecture": "Trainer-facing instructions to be used for lecturing on <UNIT-NAME>",
  "Reference": "An external resource that assists associates in understanding part or all of <UNIT-NAME>",
  "Lab - Coding Lab": "A lab that allows associates to practice coding skills in <UNIT-NAME>",
  "Lab - Coding Challenge": "A challenge that tests associates' coding skills in <UNIT-NAME>",
  "Lab - Mini Project": "A mini project that allows associates to practice coding skills in <UNIT-NAME> in a practical way",
  "Self Study": "A self-study activity that allows associates to learn about <UNIT-NAME> on their own",
  "Office Hours": "A session where associates can ask questions about <UNIT-NAME> and get help from trainers or peers",
  "Assignment": "An assignment that allows associates to practice coding skills in <UNIT-NAME>"
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
  const description = activityTypeToDescriptionMap[activity.activityType]
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
}