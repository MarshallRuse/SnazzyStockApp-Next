export const nameToSlug = (name: string): string => {
    return name.toLowerCase().replace(" ", "_");
};

export const slugToName = (slug: string): string => {
    return slug
        .replace(/\b\w+/g, (match) => {
            return match.charAt(0).toUpperCase() + match.substr(1).toLowerCase();
        })
        .replace(/['’”‘“][A-Z]{1}\b/g, (match) => {
            return match.toLowerCase();
        })
        .replace("_", " ");
};
