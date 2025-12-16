const OFFICE_HOURS_DUMMY = `
# Office Hours

## Overview

During office hours, you have the chance to ask your instructor for guidance. Here are some guidelines to help you and your fellow trainees make the most of office hours whether it be general questions or assistance with debugging. 

## Guidelines

1. Come prepared with a specific question or bug. Be prepared to explain and give context.
2. For questions, ensure that the question can not be answered anywhere else. Make sure to
    1. Review your relevant training material (lectures, notes, labs, videos, etc.)
    2. Research online to see if the question can be answered from official documentation or online forums like StackOverflow. 
    3. Ask some of your peers if they have an answer to the question. Make sure to confirm the information through research or other materials. 
    4. If these do not yield any results, feel free to ask your instructor during office hours.
3. For bugs, make sure that you have put in a good attempt in resolving it before going to your instructor, such as:
    1. Use debugging tools or print statements to find the exact root cause of the issue.
    2. Ask a friend to look at your code. Optionally, explain the problem out loud. Sometimes, this can point you in the right direction towards solving the bug. 
    3. Research online to see if anyone has encountered the same bug and posted a solution. 
    4. Review training materials to see if this bug or a similar bug was addressed.
    5. If all of the previous steps do not yield any results, ask your instructor for help. If your instructor is able to help with the bug and a new bug appears as a result, attempt to solve this new bug (steps a-d) before asking your instructor again. 
`



export const dummyActivities: {[key: string]: any} = {
  "Lesson - Learning Content": "## This is a Dummy Learning Content Activity\n\nThis activity is a placeholder for a learning content activity",
  "Assignment": "## This is a Dummy Assignment Activity\n\nThis activity is a placeholder for an assignment activity",
  "Reference": "## This is a Dummy Reference Activity\n\nThis activity is a placeholder for a reference activity",
  "Self Study": "## This is a Dummy Self Study Activity\n\nThis activity is a placeholder for a self study activity",
  "Lesson - Live Lecture": "## This is a Dummy Live Lecture Activity\n\nThis activity is a placeholder for a live lecture activity",
  "Office Hours": OFFICE_HOURS_DUMMY
}