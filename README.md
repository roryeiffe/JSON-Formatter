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

**_Responsible for Navigation.json input:_**

- Taxonomy
- Modules
- Topic


| Version    | Date | Description |
| -------- | ------- | ----------- |
| V1.0  | 05/28/2024    | This version of the JSON Formatter generates the repo structure based on an uploaded excel file. It takes into account Kannan's latest feedback including different GUID's for activities across formats, template array in navigation.json, and GUIDs for topics. |
| V1.1  | 05/28/2024    | Added automatic generation of skill name. |
| V1.2  | 06/04/2025    | Added activity mapping tool . |
| V1.3  | 07/25/2025    | Modified JSON Formatter, renaming fields (skills -> skill, exitCriteria -> exitcriteria). Removed "difficulty" field from Exit Criteria. Populates activityUrl OR activityPath based on the type of activity and where the content is located.                               |
| V1.4  |  08/01/2025  | Added functionality to pull in content from other Azure repos and include them in the downloaded zip file, while updating the activityPath field for the corresponding activities. | 