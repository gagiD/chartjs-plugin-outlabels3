module.exports = {
  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },

  env: {
    es6: true,
    node: true,
    browser: true,
  },

  extends: [
    'plugin:@typescript-eslint/recommended',
    'eslint:recommended',
    'prettier',
  ],

  rules: {},

  plugins: ['prettier'],
}
