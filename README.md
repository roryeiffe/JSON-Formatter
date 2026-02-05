# JSON Formatter

A tool for formatting and managing JSON data with an emphasis on handling **Navigation.json** inputs.

---

## Installation

Follow these steps to get started with the project:

### 1. Clone the Repository

Clone the repository to your local machine:

```bash
git clone https://github.com/uladaharanina/JSON-Formatter.git
```

2. Install Dependencies
   You can install the required dependencies using either `npm` or `bun`:

With `npm`

```bash
npm install
```

With `bun`

```bash
bun install
```

3. Run

With `npm`

```bash
npm run dev
```

With `bun`

```bash
bun run dev
```

### Components

## General Utils
| Component | Purpose |
| --------- | --------|
| [ActivityFieldGeneration.ts](./src/utils/ActivityFieldGeneration.ts) | Used to generate additional fields on activities that are not explicitly defined in the excel |
| [ActivityTypesFormatsUtil.ts](./src/utils/ActivityTypesFormatsUtil.ts) | Contains helper functions relating to activities and their types/formats |
| [FormatFileUtil.ts](./src/utils/FormatFileUtil.ts) | helper methods are used to manage the different formats for a given unit |
| [IdsGenerator.ts](./src/utils/IdsGenerator.ts) | Contains methods to generate GUIDs for activities, topics, modules, and units |
| [Sanitization.ts](./src/utils/Sanitization.ts) | Contains methods to sanitize strings for use in file paths, urls, json fields, etc. |
| [Constants.ts](./src/utils/Constants.ts) | Contains constant values used throughout the application (empty activity, empty navigation json, etc.) |
| [VersionTracker.ts](./src/utils/VersionTracker.ts) | Contains methods to track the version history of the JSON Formatter |

## Pages
| Component | Purpose |
| --------- | --------|
| [ExcelUploader.tsx](./src/components/ExcelUploader.tsx) | Main page for uploading excel files and generating the JSON files |
| [ActivityMappingUtil.tsx](./src/components/ActivityMappingUtil.tsx) | Page for mapping activities to topics and modules based on a predefined excel template |

## Excel -> JSON Workflow
Because the process of converting excel files to JSON files involves multiple steps and components, the following is a breakdown of the workflow and the relevant helper files at each step:
| Step | Description | Relevant Files |
| ---- | ----------- | -------------- |
| 1 | Parse the excel into raw json rows | [ExcelHelper.ts](./src/utils/ExcelHelper.ts) |
| 2 | Process the raw json rows into structured units, modules, topics, and activities | [ParsingHelper.ts](./src/utils/ParsingHelper.ts) |
| 3 | Generate navigation.json based on the structured data | [NavigationHelper.ts](./src/utils/NavigationHelper.ts) |
| 4 | Update activity fields and prepare format files | [FormatFileUtil.ts](./src/utils/FormatFileUtil.ts) |
| 5 | Generate the ZIP structure and download | [DownloadHelper.ts](./src/utils/DownloadHelper.ts) |



### Version History

| Version    | Date | Description |
| -------- | ------- | ----------- |
| V1.0  | 05/28/2024    | This version of the JSON Formatter generates the repo structure based on an uploaded excel file. It takes into account Kannan's latest feedback including different GUID's for activities across formats, template array in navigation.json, and GUIDs for topics. |
| V1.1  | 05/28/2024    | Added automatic generation of skill name based on information stored in the meta-data sheet in the excel workbooks. |
| V1.2  | 06/04/2025    | Added activity mapping tool. The activity mapping tool takes an excel sheet with just the topics and modules defined and automatically populates the sheet with activities that are common across most units (including written content and video for each topic, a lecture for each module, and the standard review activities) |
| V1.3  | 07/25/2025    | Modified JSON Formatter, renaming fields (skills -> skill, exitCriteria -> exitcriteria). Removed "difficulty" field from Exit Criteria. Populates activityUrl OR activityPath based on the type of activity and where the content is located.                               |
| V1.4  |  08/01/2025  | Added functionality to pull in content from other Azure repos and include them in the downloaded zip file, while updating the activityPath field for the corresponding activities. | 
| V1.5  | 08/08/2025 | Cleaned up the excel uploader, added more data validation (checking for empty titles when parsing the Excel and parsing URLs). Fixed bug where local content was being treated as external Azure content. |
| V1.6  | 08/13/2025 | Updated the format/structure of activities' descriptions. |
| V1.7  | 08/28/2025 | Cleaned up logic surrounding the generation of meta-data files for activities so that the activityURL is being properly used. | 
| V1.8  | 10/22/2025 | Added logic to fetching external Azure content so that it now pulls in images. Also modified Excel Uploader logic to set proper fields on coding lab activities. |
| V1.9  | 10/31/2025 | Added logic to check if there are any existing ids for the activities and if so, uses them instead of generating new ids. |
| V1.10 | 12/15/2025 | Added logic to generate dummy files if activity links are missing from excel file. |
| V1.11 | 12/16/2025 | Modified logic for dummy reference and dummy videos. Also added conditional downloading of different format files (ILT will always be downloaded, IST if there is at least one activity URL, and PLT if all activity URLs are filled out.)
| V2.0 | 02/05/2026 | Refactored code into modular utility files for better maintainability. Updated types and removed uses of 'any' type. Removed unused code, code, comments, and imports. |