const biomePattern = '*.{js,jsx,ts,tsx,json,jsonc,css}';
const ignoredFileSuffixes = ['web/src/routeTree.gen.ts'];

export default {
  [biomePattern]: (files) => {
    const includedFiles = files.filter(
      (file) =>
        !ignoredFileSuffixes.some((ignoredFileSuffix) =>
          file.endsWith(ignoredFileSuffix),
        ),
    );

    if (includedFiles.length === 0) {
      return [];
    }

    return [`biome check --write ${includedFiles.join(' ')}`];
  },
};
