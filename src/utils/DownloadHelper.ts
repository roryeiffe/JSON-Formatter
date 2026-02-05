import JSZip from "jszip";
import { updateActivityDescriptionAndInstructions } from "./ActivityFieldGeneration";
import { sanitizeFilename } from "./Sanitization";
import { Activity, ExternalActivity, FormatBools, FormatFiles, NavigationJson, Unit, ZipFolders } from "../types";
import { returnVersionComment } from "./VersionTracker";
import saveAs from "file-saver";

/**
 * These functions help with the final part of the ExcelUploader workflow - constructing the zip file to be downloaded
 */


/**
 * Returns either the unit name or a placeholder, used for error-checking:
 * @param unitName 
 * @returns 
 */
function getSafeUnitFolderName(unitName: string) {
  return unitName || "unit";
}

/**
 * Given a number pad it with leading 0's
 * Used to create module/topic folder names
 * @param n the given number
 * @returns padded string
 */
function formatIndex(n: number): string {
  return String(n).padStart(3, "0");
}

/**
 * Writes a single "activity stub" markdown file (3-line format) into the given folder.
 * Mutates activity by deleting activityURL when a path/repoUrl is used (preserves your current behavior).
 * @param folder the current folder
 * @param activity the activity information
 * @param unitTitle
 * @returns 
 */
function writeActivityStubFile(folder: JSZip | null | undefined, activity: Activity, unitTitle: string) {
  if (!folder) return;

  updateActivityDescriptionAndInstructions(activity, unitTitle);

  const activityUrl = activity.activityURL || activity.activityPath || activity.githubRepositoryUrl;

  const fileContent =
    "Activity Name: " + activity.displayName + "\n" +
    "Activity URL: " + activityUrl + "\n" +
    "Activity Description: " + activity.description;

  folder.file(`${sanitizeFilename(activity.activityName)}.md`, fileContent);

  if (activity.activityPath || activity.githubRepositoryUrl) {
    delete activity.activityURL;
  }
}

/**
 * Used to set the templates field in the navigation.json
 * This is the field that includes the names of the format files
 * @param navigation_json json which will be used to download as the navigation.json
 * @param unitTitle 
 * @param formatsToDownload booleans representing which formats are valid
 */
function applyNavigationTemplates(
  navigation_json: NavigationJson,
  unitTitle: string,
  formatsToDownload: FormatBools
) {
  const base = sanitizeFilename(unitTitle);

  let templates = [`${base}-taxonomy-ILT`, `${base}-taxonomy-IST`, `${base}-taxonomy-PLT`];

  if (!formatsToDownload.IST) {
    templates = templates.filter((t) => !t.endsWith("-IST"));
  }
  if (!formatsToDownload.PLT) {
    templates = templates.filter((t) => !t.endsWith("-PLT"));
  }

  navigation_json.templates = templates;
}

/**
 * Initialize the main folders (root, modules, external activities)
 * @param zip the zip object used to create files/folders
 * @param unitName 
 * @returns 
 */
export function createZipFolders(zip: JSZip, unitName: string): ZipFolders {
  const rootFolder = zip.folder(getSafeUnitFolderName(unitName))!;
  const moduleContainerFolder = rootFolder.folder("modules")!;
  const externalActivitiesFolder = rootFolder.folder("external-activities")!;
  return { rootFolder, moduleContainerFolder, externalActivitiesFolder };
}


/**
 * Given information on external activities, generate these files
 * The activityPaths should have already been updated in a previous step, so the
 * activities should already be pointing to these locations
 * @param externalActivitiesFolder the folder in which we place these new files
 * @param externalActivities json representation of the external activities
 */
export function writeExternalActivities(
  externalActivitiesFolder: JSZip,
  externalActivities: ExternalActivity[]
) {
  for (const activity of externalActivities) {
    // Images
    for (const img of activity.imgs) {
      img.newName = `${activity.name}Assets/${img.name}`;
      activity.content = activity.content.replace(new RegExp(img.oldName, "g"), img.newName);
      externalActivitiesFolder.file(img.newName, img.imgData, { base64: true });
    }

    // GIFs
    for (const gift of activity.gifts) {
      gift.newName = `${activity.name}Assets/${gift.name}`;
      activity.content = activity.content.replace(new RegExp(gift.oldName, "g"), gift.newName);
      externalActivitiesFolder.file(gift.newName, gift.giftData, { base64: true });
    }

    // Markdown
    externalActivitiesFolder.file(`${activity.name}.md`, activity.content);
  }
}

/**
 * Given the unit information and the folders, create all of the stub activity files
 * @param rootFolder 
 * @param moduleContainerFolder 
 * @param unit the unit JSON
 */
export function writeUnitStructureFiles(
  rootFolder: JSZip,
  moduleContainerFolder: JSZip,
  unit: Unit
) {
  let moduleCount = 1;

  for (const module of unit.modules) {
    if (!module.title) {
      console.warn(`Module ${moduleCount} has no title, skipping...`);
      moduleCount++;
      continue;
    }

    const moduleFolderName = `${formatIndex(moduleCount)}-${sanitizeFilename(module.title)}`;
    const moduleFolder = moduleContainerFolder.folder(moduleFolderName);

    let topicCount = 1;

    for (const topic of module.topics) {
      if (!topic.title) {
        console.warn(`Topic ${topicCount} in Module ${module.title} has no title, skipping...`);
        topicCount++;
        continue;
      }

      const topicFolderName = `${formatIndex(topicCount)}-${sanitizeFilename(topic.title)}`;
      const topicFolder = moduleFolder?.folder(topicFolderName);

      for (const activity of topic.topicActivities ?? []) {
        writeActivityStubFile(topicFolder, activity, unit.title);
      }

      topicCount++;
    }

    for (const activity of module.moduleActivities ?? []) {
      writeActivityStubFile(moduleFolder, activity, unit.title);
    }

    moduleCount++;
  }

  for (const activity of unit.unitActivities ?? []) {
    writeActivityStubFile(rootFolder, activity, unit.title);
  }
}

/**
 * Write the navigation.json and the format files to the root folder
 * @param rootFolder 
 * @param unitTitle 
 * @param navigation_json 
 * @param format_files 
 * @param formatsToDownload 
 */
export function writeRootArtifacts(
  rootFolder: JSZip,
  unitTitle: string,
  navigation_json: NavigationJson,
  format_files: FormatFiles,
  formatsToDownload: FormatBools
) {
  const base = sanitizeFilename(unitTitle);

  applyNavigationTemplates(navigation_json, unitTitle, formatsToDownload);

  rootFolder.file("navigation.json", JSON.stringify(navigation_json, null, 2));
  rootFolder.file(`${base}-taxonomy-ILT.json`, JSON.stringify(format_files.ILTFormatFile, null, 2));

  if (formatsToDownload.IST) {
    rootFolder.file(`${base}-taxonomy-IST.json`, JSON.stringify(format_files.ISTFormatFile, null, 2));
  }

  if (formatsToDownload.PLT) {
    rootFolder.file(`${base}-taxonomy-PLT.json`, JSON.stringify(format_files.PLTFormatFile, null, 2));
  }

  rootFolder.file(`${base}-version-metadata.md`, returnVersionComment());
}

/**
 * Finally, download everything, based on the zip file that have been programatically constructing
 * @param zip 
 * @param unitName 
 */
export async function finalizeAndDownloadZip(zip: JSZip, unitName: string) {
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${getSafeUnitFolderName(unitName)}-generated-files.zip`);
}
