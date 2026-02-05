/**
 * This file is used to track changes made to this code-base.
 * Whenever we make changes, we need to update the README with information on the new version
 * And, update this version value so every time we generate a new unit, it will include this small snippet
 * indicating what version of the formatter was used.
 */
const version = 'v1.11';

export const returnVersionComment = () => {
    return `// Version: ${version} - This comment is auto-generated. Do not edit manually.`;
}