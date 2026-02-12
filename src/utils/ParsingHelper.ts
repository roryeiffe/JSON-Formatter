import axios from "axios";
import { PRODUCTION_URL } from "../urls";
import { Activity, FindContextResult, ModuleRef, ParseContext, TaxonomyRow, TopicRef } from "../types";
import { getId } from "./IDsGenerator";
import { getUnitNameVariants, isValidTitle, sanitizeFilename } from "./Sanitization";
import { getActivityCode } from "./ActivityTypesFormatsUtil";
import { dummyActivities, EMPTY_ACTIVITY } from "./Constants";

/**
 * This file contains helper methods that break up the processing of the excel data
 * into manageable steps
 * An object of type ParseContext is used to manage the data that is managed by multiple functions
 * Notably: 
 *  - unit - represents the unit itself, including all modules, topics, and activities
 *  - externalActivities - representation of external activities that are pulled in from existing repos
 */


/**
 * Given a unit name, searches the Azure repos for a matching unit and if found,
 * returns a mapping of activity names to ids. This makes it possible to re-use
 * existing activity ids instead of generating a new one each time we use the formatter
 * @param unitName 
 * @returns mapping of activity names to ids
 */
export async function fetchExistingActivityIds(unitName: string): Promise<Record<string, string>> {
  try {
    const res = await axios.post(`${PRODUCTION_URL}/fetch-activity-ids`, { unitName });
    return res.data as Record<string, string>;
  } catch (error) {
    alert("Failed to fetch existing activity IDs. New IDs will be generated for all activities.");
    console.error("Failed to fetch existing activity IDs:", error);
    return {}; // fallback
  }
}

export async function fetchUnitId(unitName: string): Promise<string> {
  try {
    const res = await axios.post(`${PRODUCTION_URL}/fetch-unit-id`, { unitName });
    return res.data.unitId;
  } catch (error) {
    alert("Failed to fetch existing unit ID.");
    console.error("Failed to fetch existing unit ID:", error);
    return ''; // fallback
  }
}

/**
 * Given the context (see above) and the raw values for topic/module name
 * Check which of the titles are valid and create the module/topic object
 * @param ctx contains data that is shared among these helper functions
 * @param moduleTitleRaw the raw value of the module name from the excel (could be N/A)
 * @param topicTitleRaw the raw value of the topic name from the excel (could be N/A)
 * @returns 
 */
export async function getOrCreateModuleTopic(
  ctx: ParseContext,
  moduleTitleRaw: string | undefined,
  topicTitleRaw: string | undefined
): Promise<FindContextResult> {
  // Initialization:
  const moduleTitle = moduleTitleRaw?.trim();
  const topicTitle = topicTitleRaw?.trim();

  let currentModule: ModuleRef | null = null;
  let currentTopic: TopicRef | null = null;

  // Check if valid module, if so create the object and add it to the unit
  if (isValidTitle(moduleTitle)) {
    currentModule = ctx.unit.modules.find((m) => m.title === moduleTitle) ?? null;

    if (!currentModule) {
      currentModule = {
        id: await getId(ctx, moduleTitle),
        title: moduleTitle,
        description: "",
        topics: [],
        moduleActivities: [],
      } as ModuleRef;

      ctx.unit.modules.push(currentModule);
    }
  }

  // Check if valid topic, if so create the object and add it to the module
  if (isValidTitle(topicTitle) && currentModule) {
    currentTopic = currentModule.topics.find((t) => t.title === topicTitle) ?? null;

    if (!currentTopic) {
      currentTopic = {
        id: await getId(ctx, topicTitle),
        title: topicTitle,
        description: "",
        topicActivities: [],
      } as TopicRef;

      currentModule.topics.push(currentTopic);
    }
  }

  return { currentModule, currentTopic };
}

/**
 * Given context and a raw taxonomy row, convert to an activity object
 * @param ctx information that is shared between these functions
 * @param row the raw taxonomy row (literally just a representation of the column values from the excel)
 * @returns a valid activity object (which fits the shape expected by Evolv platform)
 */
export async function buildBaseActivity(ctx: ParseContext, row: TaxonomyRow): Promise<any | null> {
  let activityName: string | undefined = row["Activity Name"]?.trim();
  if (!activityName) return null;

  activityName = sanitizeFilename(activityName).trim();

  const activity = {
    ...EMPTY_ACTIVITY,
    activityId: await getId(ctx, activityName),
    activityName,
    displayName: row["Display Name"]?.trim(),
    activityType: row["Activity Type"],
    type: getActivityCode(row["Activity Type"]),
    duration: row["Duration"],
    isReview: row["Activity Grouping"]?.trim() === "Review",
  };

  return activity;
}

/**
 * Resolves and assigns content metadata for an activity based on a taxonomy row.
 *
 * This function decides how an activity's content should be represented in the generated artifacts:
 * - as a direct URL (existing content)
 * - as a local/packaged file path inside the output zip (created content)
 * - or as a generated "dummy" external markdown file when no URL is provided in the spreadsheet (For ILT units, with no actual activity yet)
 *
 * First, check the URL for a few different cases:
 * URL present - Attempts to parse the URL and populate activityUrl and/or activityPath
  * Azure DevOps URL - If the URL appears to reference content within the current unit's repo structure,
  * extracts the path value and stores it in activityPath. (This is for content that we create, not curate)
  * Otherwise, fetches the remote file content via back-end, stores the content in externalActivities and sets activityPath to point to this location (This is for content pulled in from an existing repo, like Exa)
  * Non-standard domain URL: Creates a URL attachment entry in so the link is preserved as an auxiliary resource (External resources like w3schools, GeeksForGeeks)
 * No URL provided:Creates a dummy activity representation. Depending on activity type, this may be a hardcoded 
 * video URL, a hardcoded reference attachment, or a generated dummy markdown file
 *
 * Side Effects
 *   Updates nonEmptyActivityCount or emptyActivityCount for later format decisions
 *   Adds entries to externalActivities when external Azure content is fetched or dummy markdown files are generated
 *  Sets errorOccurredLocal = true when invalid URLs, failed fetches, or missing final URL/path occurs
 */
export async function resolveActivityContent(
  ctx: ParseContext,
  activity: Activity,
  row: TaxonomyRow,
  unitTitle: string,
  moduleTitle?: string,
  topicTitle?: string
): Promise<void> {
  const { unitNameLower, unitNameWithHyphensLower } = getUnitNameVariants(unitTitle);

  const url = row["Content URL"]?.trim();

  if (url) {
    ctx.nonEmptyActivityCount++;

    try {
      // try to parse the url:
      const parsedUrl = new URL(url);
      const decodedPathName = decodeURIComponent(parsedUrl.pathname).toLowerCase();

      activity.activityURL = url;

      // Attach external URL attachment if not a standard domain
      const standardDomains = ["dev.azure.com", "github.com", "vimeo.com", "youtube.com"];
      const isStandardDomain = standardDomains.some((d) => parsedUrl.hostname.includes(d));

      // If not a standard domain, we need a urlAttachment field:
      if (!isStandardDomain) {
        const description =
          activity.type === "ACT007"
            ? `Reference material for ${activity.displayName}.`
            : `Additional resource for ${activity.displayName}.`;

        activity.urlAttachments = [
          {
            name: `${activity.displayName} ${activity.type === "ACT0062" ? "Guide" : ""}`.trim(),
            description,
            url,
          },
        ];
      }

      // Not Azure link: don't keep activityPath
      if (!url.startsWith("https://dev.azure.com/Revature-Technology/Technology-Engineering/")) {
        delete activity.activityPath;
        return;
      }

      // Azure link + local unit content: store path
      if (decodedPathName.includes(unitNameLower) || decodedPathName.includes(unitNameWithHyphensLower)) {
        const path = parsedUrl.searchParams.get("path") || "";
        activity.activityPath = "." + path;
        return;
      }

      // Azure link + external: fetch content
      try {
        const res = await axios.post(`${PRODUCTION_URL}/fetch-azure-file`, { url });
        const data = res.data;
        const markdown = JSON.parse(data.content).content;
        const imgs = data.imgs || [];
        const gifts = data.gifts || [];

        ctx.externalActivities.push({
          name: row["Activity Name"],
          content: markdown,
          imgs,
          gifts,
        });

        // update activityPath to match the new location of the pulled in file
        activity.activityPath = `./external-activities/${activity.activityName}.md`;
      } catch (error) {
        ctx.errorOccurredLocal = true;
        console.error(`Failed to fetch external activity content for URL: ${url}`, error);
        activity.activityPath = null;
      }
    } catch (error) {
      ctx.errorOccurredLocal = true;
      console.error(error);
      console.error(`Invalid URL for activity "${activity.activityName}":`, url);
      activity.activityURL = url;
    }

    if (!(activity.activityPath || activity.activityURL)) {
      ctx.errorOccurredLocal = true;
      console.error(`Activity "${activity.activityName}" has no valid URL or path.`);
    }

    return;
  }

  // No URL -> dummy behavior
  ctx.emptyActivityCount++;

  const activityType = row["Activity Type"];

  if (activityType === "Lesson - Video") {
    activity.activityURL = "https://vimeo.com/1146990738";
    return;
  }

  if (activityType === "Reference") {
    activity.urlAttachments = [
      {
        name: `${activity.displayName} Guide`,
        description: `Reference material for ${activity.displayName}.`,
        url: "https://coda.io/d/_d_FyQRVQKou/Reference-Activity_su3JMcEv",
      },
    ];
    return;
  }

  let markdownContent = dummyActivities[activityType];
  if (!markdownContent) {
    markdownContent = "## This is a Dummy Activity\n\n" + markdownContent;
  }

  const dummyFileName = `${activityType.replace(/[^a-zA-Z0-9]/g, "")}-dummy`;

  if (!ctx.dummyActivityTypes.has(activityType)) {
    ctx.externalActivities.push({ name: dummyFileName, content: markdownContent, imgs: [], gifts: [] });
    ctx.dummyActivityTypes.add(activityType);
  }

  activity.activityPath = `./external-activities/${dummyFileName}.md`;
  delete activity.activityURL;
}

/**
 * Removes activityURL field from activity if it is a lab type (url will be in the GithubRepositoryUrl field)
 * @param activity
 */
export function postProcessActivity(activity: Activity) {
  if (typeof activity.activityType === "string" && activity.activityType.startsWith("Lab -")) {
    activity.githubRepositoryUrl = activity.activityURL;
    delete activity.activityURL;
  }
}

/**
 * Given an activity, scope, and some context information, push the activity to the right 
 * taxonomy item (unit, module, topic)
 * @param ctx 
 * @param activity the activity to be added
 * @param scopeRaw the scope ("unit", "module", "topic")
 * @param currentModule 
 * @param currentTopic 
 */
export function assignActivityByScope(
  ctx: ParseContext,
  activity: Activity,
  scopeRaw: string | undefined,
  currentModule: ModuleRef | null,
  currentTopic: TopicRef | null
) {
  const scope = scopeRaw?.trim().toLowerCase();

  if (scope === "unit") ctx.unit.unitActivities?.push(activity);
  else if (scope === "module" && currentModule) currentModule.moduleActivities?.push(activity);
  else if (scope === "topic" && currentTopic) currentTopic.topicActivities?.push(activity);
  else {
    console.warn(`Activity "${activity.activityName}" has an invalid scope: [${scope}]`);
    ctx.errorOccurredLocal = true;
  }
}


