/**
 * This file contains general helper functions used to clean up or sanitize strings by
 * - Removing invalid characters
 * - Removing whitespace
 * - Producing variants of strings to help with exact matching
 */


export const INVALID_TITLES = new Set(["N/A", "NA", "n/a"]);

/**
 * Given a filename, sanitize by replacing illegal characters with _
 * @param filename the filename, potentially containing illegal characters like / : etc.
 * @returns the sanitized filename, free of illegal characters
 */
export const sanitizeFilename = (filename: string) => {
  return filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
}

/**
 * Checks if module/topic title is invalid (N/A and variations)
 * @param title
 * @returns boolean indicating whether the title is valid
 */
export function isValidTitle(title: string | undefined | null): title is string {
  if (!title) return false;
  const t = title.trim();
  return t.length > 0 && !INVALID_TITLES.has(t);
}

/**
 * Returns case variants of a given unit title (used for matching against Azure repo names)
 * @param unitTitle
 * @returns regular, lower, case, and hyphenated version of the unit title
 */
export function getUnitNameVariants(unitTitle: string) {
  const unitName = unitTitle.replace(/ Unit/g, "");
  return {
    unitName,
    unitNameLower: unitName.toLowerCase(),
    unitNameWithHyphensLower: unitName.replace(/ /g, "-").toLowerCase(),
  };
}
