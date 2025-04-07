import React, {MouseEventHandler} from 'react';

// Props:
type AppProps = {
  onClick: MouseEventHandler,
  text: string,
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
  activityType: string,
  type: string,
  activityPath: string,
  activityURL: string,
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
  vsCodeExtensionUrl?: string,
  artifactAttachments: ArtifactAttachment[],
  urlAttachments: URLAttachment[],
  isILT?: boolean,
  isIST?: boolean,
  isPLT?: boolean,
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

type Topic = {
  id: string,
  url: string,
  title: string,
  tooltip: string,
  topicActivities?: Activity[]
}

type Prerequisites = {
  url: string,
  title: string,
  tooltip: string
}

type Module = {
  id: string,
  title: string,
  url: string,
  description: string,
  tooltip: string,
  prerequisites: Prerequisites,
  topics: Topic [],
  moduleActivities?: Activity[]
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
  tutorials: boolean
}


export {Unit, Module, Topic, Activity, Prerequisites, AppProps, AddActivityProps, HierarchyItem, HierarchyType, UnitActivity, ModuleActivity, TopicActivity, ArtifactAttachment, ArtifactAttachmentProps, URLAttachment, URLAttachmentFormProps, TagFormProps, Tag, SkillFormProps}