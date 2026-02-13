
import * as XLSX from "xlsx";
import { ExitCriteriaRow, MetadataRow, ParsedExcelPayload, ParsedRow, TaxonomyRow } from "../types";
import { EXCEL_FILE_ENDINGS } from "./Constants";

/**
 * These helper functions involve the process of converting the Excel data to 
 * JSON. The JSON will still to be processed further via the functions found in
 * ParsingHelper.ts
 * @param file 
 * @returns 
 */

/**
 * Reads a File as a binary string (legacy XLSX API expects 'binary' read type).
 * @param file 
 * @returns a promise which, when resolved returns the contents of the file
 * to be passed down later for further formatting
 */
export function readFileAsBinaryString(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") resolve(result);
      else reject(new Error("FileReader result was not a string."));
    };

    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed."));
    reader.readAsBinaryString(file);
  });
}

/**
 * Derives a unit name from the uploaded file name by stripping extension,
 * optional " (n)" suffix, and common endings like "Unit Breakdown" (found in constants.ts)
 * @param fileName the name of the file
 * @returns the unit name
 */
export function deriveUnitName(fileName: string): string {
  let unitName = fileName.substring(0, fileName.lastIndexOf(".")); // no extension
  unitName = unitName.replace(/\s*\(\d+\)\s*$/, ""); // remove (n)

  for (const ending of EXCEL_FILE_ENDINGS) {
    if (unitName.endsWith(ending)) {
      unitName = unitName.slice(0, -ending.length).trim();
    }
  }
  return unitName;
}

/**
 * Reads the uploaded Excel file and returns the parsed rows for each expected sheet.
 * Throws if sheets are missing or the file can't be read.
 * @param file 
 * @returns some meta-data info (fileName, unitName). Also some JSON that just represents
 * the raw data found in the excels
 */
export async function parseUploadedExcel(file: File): Promise<ParsedExcelPayload> {
  const binaryStr = await readFileAsBinaryString(file);
  const workbook = XLSX.read(binaryStr, { type: "binary" });

  const taxonomySheet = workbook.Sheets["Taxonomy"];
  const exitCriteriaSheet = workbook.Sheets["Exit Criteria"];
  const metadataSheet = workbook.Sheets["Metadata"];

  if (!taxonomySheet) throw new Error(`Missing sheet: "Taxonomy"`);
  if (!exitCriteriaSheet) throw new Error(`Missing sheet: "Exit Criteria"`);
  if (!metadataSheet) throw new Error(`Missing sheet: "Metadata"`);

  const taxonomyRows:TaxonomyRow[] = XLSX.utils.sheet_to_json<TaxonomyRow>(taxonomySheet);
  const exitCriteriaRows:ExitCriteriaRow[] = XLSX.utils.sheet_to_json<ExitCriteriaRow>(exitCriteriaSheet);
  const metadataRows:MetadataRow[] = XLSX.utils.sheet_to_json<MetadataRow>(metadataSheet, { range: 1 });

  return {
    fileName: file.name,
    unitName: deriveUnitName(file.name),
    taxonomyRows,
    exitCriteriaRows,
    metadataRows,
  };
}


