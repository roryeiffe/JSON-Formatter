

export const IDsGenerator = async (title: string): Promise<string> => {

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(title)); 
    const hashArray = Array.from(new Uint8Array(hashBuffer)); 
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join(''); 
    const formattedID = hashHex.replace(/(.{8})/g, '$1-').slice(0, 35); 
    return formattedID; 
}

export const IDsGeneratorRandom = (): string => {
    const randomValues = new Uint8Array(16);
    crypto.getRandomValues(randomValues);
    const hashArray = Array.from(randomValues);
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    const formattedID = hashHex.replace(/(.{8})/g, '$1-').slice(0, 35);
    return formattedID;
}
  