/**
 * ESLint configuration.
 *
 * `npm run lint` was in package.json from the start and had never once run:
 * there was no config file, so every invocation died with "couldn't find a
 * configuration file" — which also means the script silently passed in any
 * chain that swallowed its exit code. The plugins it needs were already
 * installed; only this file was missing.
 *
 * Three environments in one repository, so three overrides:
 *   src/      browser + React, JSX
 *   api/      Vercel serverless functions — Node globals, no JSX
 *   scripts/  build-time Node tooling
 */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'dist-ssr', 'node_modules', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: 'detect' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    // The site renders real quotation marks and apostrophes in copy. Escaping
    // them as entities in JSX would make the source unreadable for no gain —
    // React escapes on render anyway.
    'react/no-unescaped-entities': 'off',
    // This codebase does not use PropTypes — the package is not even a
    // dependency — so the rule reported every prop of every component, 80-odd
    // errors describing a convention the project deliberately does not follow.
    'react/prop-types': 'off',
  },
  overrides: [
    {
      files: ['api/**/*.js', 'scripts/**/*.js', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js'],
      env: { node: true, browser: false },
      extends: ['eslint:recommended'],
      rules: { 'react-refresh/only-export-components': 'off' },
    },
  ],
}
