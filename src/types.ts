import React, {MouseEventHandler} from 'react';

// Props:
type AppProps = {
  onClick: MouseEventHandler,
  text: string,
}


type ParsedRow = Record<string, any>;

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

type AddActivityProps = {
  hierarchyItem: HierarchyItem,
  upsertActivityFunc: (activityDetails: Activity,  hierarchyType: HierarchyType, id: string) => void,
  updateMode: boolean,
  activityProp?: Activity
}

type ArtifactAttachmentProps = {
  activity: Activity,
  setActivity: (activity: Activity) => void,
}

type URLAttachmentFormProps = ArtifactAttachmentProps;

type TagFormProps = ArtifactAttachmentProps;
type SkillFormProps = ArtifactAttachmentProps;

// Taxonomy Types (Activities, Topics, Modules, Units):

type Tag = {
  id: string,
  name: string
}

type Skill = {
  id: string,
  name: string
}

type Activity = {
  activityId: string,
  unitId?: string,
  moduleId?: string,
  topicId?: string,
  activityName: string,
  displayName: string,
  activityType: string,
  type: string,
  activityPath?: string,
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
  imgs?: any[],
}



type UnitActivity = Activity | {
  unitId: string,
}

type ModuleActivity = Activity | {
  moduleId: string
}

type TopicActivity = Activity | {
  topicId: string
}



type Prerequisites = {
  url: string,
  title: string,
  tooltip: string
}

type Unit = {
  code?: string,
  name?: string,
  version?: string,
  id: string,
  title: string,
  description: string,
  modules: Module [],
  unitActivities?: Activity[]
}

type Module = {
  id: string,
  title: string,
  url?: string,
  description: string,
  tooltip?: string,
  prerequisites?: Prerequisites,
  topics: Topic [],
  moduleActivities?: Activity[]
}


type Topic = {
  id: string,
  url?: string,
  title: string,
  tooltip?: string,
  description: string,
  topicActivities?: Activity[]
}

export type ExternalActivity = {
  name: string,
  content: string
  gifts: {
    giftData: string,
    name: string,
    newName: string,
    oldName: string
  } [],
  imgs: {
    imgData: string,
    name: string,
    newName: string,
    oldName: string
  } []
}

export type FormatBools = {
  ILT: boolean,
  PLT: boolean,
  IST: boolean
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

export type BuildArtifactsResult = {
  parsedTaxonomy: any;            // replace with your Unit type
  externalActivities: any[];      // replace with type
  formatsToDownload: any;         // replace with type
  navigationJson: unknown;
  formatFiles: unknown;
  unitName: string;
};


export type ParsedExcelPayload = {
  fileName: string;
  unitName: string;
  taxonomyRows: TaxonomyRow[];
  exitCriteriaRows: ParsedRow[];
  metadataRows: ParsedRow[];
};

export type ParseContext = {
  unit: Unit;
  externalActivities: ExternalActivity[];
  errorOccurredLocal: boolean;

  activityIds: Record<string, string>; // or whatever the API returns
  dummyActivityTypes: Set<string>;

  emptyActivityCount: number;
  nonEmptyActivityCount: number;

  // If you want: cache IDs so you don't await IDsGenerator multiple times for same title
  idCache: Map<string, string>;
};

export type ModuleRef = Unit["modules"][number];
export type TopicRef = ModuleRef["topics"][number];

export type FindContextResult = {
  currentModule: ModuleRef | null;
  currentTopic: TopicRef | null;
};




export {Unit, Module, Topic, Activity, Prerequisites, AppProps, AddActivityProps, HierarchyItem, HierarchyType, UnitActivity, ModuleActivity, TopicActivity, ArtifactAttachment, ArtifactAttachmentProps, URLAttachment, URLAttachmentFormProps, TagFormProps, Tag, SkillFormProps, ParsedRow}