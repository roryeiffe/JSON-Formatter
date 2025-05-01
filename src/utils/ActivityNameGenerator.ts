const sanitizeActivityType = (activityType:string) => {
  // Remove leading instances of "Lesson - " and "Lab - "
  const sanitizedType = activityType.replace(/^(Lesson - |Lab - )/, '');
  return sanitizedType;
}


export const getReadableActivityName = (activity:any, hierarchyItem:string) => {
  let activityName = hierarchyItem;
  activityName += " - " + sanitizeActivityType(activity.activityType);
  if(activity.isReview) {
    activityName += " (Review)";
  }
  return activityName;

}