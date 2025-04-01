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
  activityId?: string
}

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
  isOptional: boolean;
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
  activities?: Activity[]
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
  activities?: Activity[]
}

type Unit = {
  code?: string,
  name?: string,
  version?: string,
  id: string,
  title: string,
  description: string,
  modules: Module [],
  activities?: Activity[]
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


export {Unit, Module, Topic, Activity, Prerequisites, AppProps, AddActivityProps, HierarchyItem, HierarchyType, UnitActivity, ModuleActivity, TopicActivity}