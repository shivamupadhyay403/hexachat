export default {
  semi: false,
  singleQuote: true,
  jsxSingleQuote: false,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  endOfLine: 'lf',
  overrides: [
    {
      files: ['*.json', '*.md'],
      options: { printWidth: 80 },
    },
    {
      files: ['*.css', '*.scss'],
      options: { singleQuote: false },
    },
  ],
}