import React, {MouseEventHandler} from 'react';

// Props:
type AppProps = {
  onClick: MouseEventHandler,
  text: string,
}

type AddActivityProps = {
  hierarchyItem: HierarchyItem,
  addActivityFunc: (activityDetails: Activity,  hierarchyType: HierarchyType, id: string) => void
}

// Taxonomy Types (Activities, Topics, Modules, Units):

type Activity = {
  activityId: string,
  activityName: string,
  activityType: string,
  activityPath: string,
  isILT?: boolean,
  isIST?: boolean,
  isPLT?: boolean,
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


export {Unit, Module, Topic, Activity, Prerequisites, AppProps, AddActivityProps, HierarchyItem, HierarchyType}