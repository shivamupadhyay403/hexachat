// .prettierrc.js  (project root)
/** @type {import("prettier").Config} */
module.exports = {
    // Formatting
    semi: false,                  // no semicolons
    singleQuote: true,            // 'string' not "string"
    jsxSingleQuote: false,        // <Component prop="value" />
    trailingComma: "all",         // trailing commas everywhere valid
    printWidth: 100,              // line wrap at 100 chars
    tabWidth: 2,                  // 2 spaces
    useTabs: false,
    bracketSpacing: true,         // { foo: bar }
    bracketSameLine: false,       // JSX > on new line
    arrowParens: "always",        // (x) => x  not  x => x
    endOfLine: "lf",              // unix line endings (important for git)
  
    // File overrides
    overrides: [
      {
        files: ["*.json", "*.md"],
        options: { printWidth: 80 },
      },
      {
        files: ["*.css", "*.scss"],
        options: { singleQuote: false },
      },
    ],
  }