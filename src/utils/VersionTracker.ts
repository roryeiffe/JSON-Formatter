const version = 'v1.1';

export const returnVersionComment = () => {
    return `// Version: ${version} - This comment is auto-generated. Do not edit manually.`;
}


// Version 1: As of 5/21/2025, the JSON formatter lets you upload an excel file and download the
// generated navigation.json and format files. the following are the most recent changes:
// TODO: Move this info to a markdown file in the repo
/*
Different GUIDs for same activity across different formats
templateCode in format file
Activity Codes
Need to introduce a key as "skills": "Skill Name" which needs to be mandatory (In the master navigation JSON
Need to introduce template array 
templates":["Master TypeScript Concepts-taxonomy-ILT","Master TypeScript Concepts-taxonomy-IST","Master TypeScript Concepts-taxonomy-PLT"]
Implement Version Tracking for JSON Formatter (have this appear as a comment or something somewhere in the repo)
Need to introduce a key as "skills": "Skill Name" which needs to be mandatory (In the master navigation JSON
GUIDs for topics
*/