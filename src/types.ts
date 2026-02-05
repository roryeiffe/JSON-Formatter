import JSZip from 'jszip';
import React, { MouseEventHandler } from 'react';

// Alias
export type ActivityIds = any;

// PROPS TYPES FOR COMPONENTS:
export type AppProps = {
  onClick: MouseEventHandler,
  text: string,
}

export type AddActivityProps = {
  hierarchyItem: HierarchyItem,
  upsertActivityFunc: (activityDetails: Activity, hierarchyType: HierarchyType, id: string) => void,
  updateMode: boolean,
  activityProp?: Activity
}

export type ArtifactAttachmentProps = {
  activity: Activity,
  setActivity: (activity: Activity) => void,
}

export type URLAttachmentFormProps = ArtifactAttachmentProps;
export type TagFormProps = ArtifactAttachmentProps;
export type SkillFormProps = ArtifactAttachmentProps;

// TAXONOMY TYPES (UNIT/MODULE/TOPIC):
export type Unit = {
  code?: string,
  name?: string,
  version?: string,
  id: string,
  title: string,
  description?: string,
  modules: Module[],
  unitActivities?: Activity[]
}

export type NavigationJSONHelper = {
  templates: string[],
  duration: number,
  tags: string[],
  exitcriteria: {
    title: string,
    assessmentApproach?: string
  }[],
  skill: string
}
export type NavigationJson = Unit & NavigationJSONHelper;



export type Module = {
  id: string,
  title: string,
  url?: string,
  description?: string,
  tooltip?: string,
  prerequisites?: Prerequisites,
  topics: Topic[],
  moduleActivities?: Activity[]
}

export type Topic = {
  id: string,
  url?: string,
  title: string,
  tooltip?: string,
  description?: string,
  topicActivities?: Activity[]
}

// Represents the Different Types of Hierarchy Items
enum HierarchyType {
  UNIT = 'Unit',
  MODULE = 'Module',
  TOPIC = 'Topic'
}

// Represents data on a given hierarchy item, whether it is a unit/module/topic
type HierarchyItem = {
  hierarchyType?: HierarchyType,
  // the name of the unit/module/topic:
  title: string,
  id: string
}

// ACTIVITY TYPES:
export type Activity = {
  activityId: string,
  unitId?: string,
  moduleId?: string,
  topicId?: string,
  activityName: string,
  displayName: string,
  activityType: string,
  type: string,
  activityPath?: string | null,
  activityURL?: string,
  description: string,
  trainerNotes: string,
  instruction: string,
  duration: number,
  tags: Tag[],
  skills: Skill[],
  isReview: boolean,
  createdAt: Date,
  isOptional: boolean,
  maxScore?: number,
  githubRepositoryUrl?: string,
  vsCodeExtensions?: string,
  artifactAttachments: ArtifactAttachment[],
  urlAttachments?: URLAttachment[],
  isILT?: boolean,
  isIST?: boolean,
  isPLT?: boolean,
  imgs?: string[],
}

export type Tag = {
  id: string,
  name: string
}

export type Skill = {
  id: string,
  name: string
}

export type Prerequisites = {
  url: string,
  title: string,
  tooltip: string
}

type ArtifactAttachment = {
  name: string,
  description: string,
  fileUrl: string,
  fileName: string,
  fileSize: string
}

type URLAttachment = {
  name: string,
  description: string,
  url: string,
}


// Represents information about an external activity that we have to pull in
export type ExternalActivity = {
  name: string,
  content: string
  gifts: {
    giftData: string,
    name: string,
    newName: string,
    oldName: string
  }[],
  imgs: {
    imgData: string,
    name: string,
    newName: string,
    oldName: string
  }[]
}

// EXCEL PARSING TYPES:

// Used to indicate which format(s) a given unit includes
export type FormatBools = {
  ILT: boolean,
  PLT: boolean,
  IST: boolean
}
export type formatKey = "isILT" | "isIST" | "isPLT";

export type FormatFiles = {
  ILTFormatFile?: Unit,
  ISTFormatFile?: Unit,
  PLTFormatFile?: Unit
}


// Excel Parsing Types:
export type ParsedRow = Record<string, any>;

export type TaxonomyRow = {
  "Activity Grouping": string
  "Activity Name": string
  "Activity Order": string
  "Activity Scope": string
  "Activity Type": string
  "Content URL": string
  "Display Name": string
  "Duration": string
  "Module": string
  "Topic": string
}

export type ExitCriteriaRow = {
  "Taxonomy Level"?: string;
  "Criteria Difficulty": string;
  "Exit Criteria": string;
  "Assessment Approach": string;
}

export type MetadataRow = {
  "Tag Type"?: string,
  "Tag Value": string,
}

// Represents the payload after parsing an uploaded excel file
export type ParsedExcelPayload = {
  fileName: string;
  unitName: string;
  taxonomyRows: TaxonomyRow[];
  exitCriteriaRows: ExitCriteriaRow[];
  metadataRows: MetadataRow[];
};

// JSON PROCESSING TYPES:

// Because parsing was broken into multiple steps, we need a context object to pass
// along common data (like the unit representation, external activities, etc.)
export type ParseContext = {
  unit: Unit;
  externalActivities: ExternalActivity[];
  errorOccurredLocal: boolean;

  activityIds: Record<string, string>; // or whatever the API returns
  dummyActivityTypes: Set<string>;

  emptyActivityCount: number;
  nonEmptyActivityCount: number;

  idCache: Map<string, string>;
};

// References to Module/Topic within a Unit
export type ModuleRef = Unit["modules"][number];
export type TopicRef = ModuleRef["topics"][number];

// Result of finding/creating module/topic
export type FindContextResult = {
  currentModule: ModuleRef | null;
  currentTopic: TopicRef | null;
};

// ZIP FILE TYPES:

// Represents the folders within the zip structure
export type ZipFolders = {
  rootFolder: JSZip;
  moduleContainerFolder: JSZip;
  externalActivitiesFolder: JSZip;
};


// export type BuildArtifactsResult = {
//   parsedTaxonomy: any;            // replace with your Unit type
//   externalActivities: any[];      // replace with type
//   formatsToDownload: any;         // replace with type
//   navigationJson: unknown;
//   formatFiles: unknown;
//   unitName: string;
// };

