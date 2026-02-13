import { ParseContext } from "../types";

/**
 * Generate an id based on a title
 * @param title
 * @returns an id for that title
 */
export const IDsGenerator = async (title: string): Promise<string> => {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(title)); 
    const hashArray = Array.from(new Uint8Array(hashBuffer)); 
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join(''); 
    const formattedID = hashHex.replace(/(.{8})/g, '$1-').slice(0, 35); 
    return formattedID; 
}

/**
 * Generates a random id
 * @returns 
 */
export const IDsGeneratorRandom = (): string => {
    const randomValues = new Uint8Array(16);
    crypto.getRandomValues(randomValues);
    const hashArray = Array.from(randomValues);
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    const formattedID = hashHex.replace(/(.{8})/g, '$1-').slice(0, 35);
    return formattedID;
}

/**
 * Checks context to see if we have an id for the key that we pass in
 * If not, generate a new one
 * @param ctx contains mapping from activity name to id
 * @param key name of activity that we are checking
 * @returns either an existing id or a new/generated id
 */
export async function getId(ctx: ParseContext, key: string): Promise<string> {
  const cached = ctx.idCache.get(key);
  if (cached) return cached;
  const id = await IDsGenerator(key);
  ctx.idCache.set(key, id);
  return id;
}