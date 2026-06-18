const ignoreBuildOutputs = files =>
  files.filter(
    file => !file.includes("/preview/static/") && !file.includes("/public/")
  );

export default {
  "*.{js,jsx,ts,tsx}": files => {
    const filtered = ignoreBuildOutputs(files);

    return filtered.length
      ? [
          `prettier --cache --ignore-unknown --write ${filtered.join(" ")}`,
          `eslint --cache --fix ${filtered.join(" ")}`
        ]
      : [];
  },
  "{!(package)*.json,*.code-snippets,.!({browserslist,npm,nvm})*rc}": [
    "prettier --cache --write --parser json"
  ],
  "package.json": ["prettier --cache --write"],
  "*.vue": [
    "prettier --write",
    "eslint --cache --fix",
    "stylelint --fix --allow-empty-input"
  ],
  "*.{css,scss,html}": [
    "prettier --cache --ignore-unknown --write",
    "stylelint --fix --allow-empty-input"
  ],
  "*.md": ["prettier --cache --ignore-unknown --write"]
};
