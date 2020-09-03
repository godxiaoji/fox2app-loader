module.exports = {
  root: true,
  env: {
    node: true
  },
  globals: {},
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 10,
    sourceType: 'module'
  },
  rules: {
    strict: 0,
    'newline-per-chained-call': 0,
    semi: ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'array-bracket-spacing': ['error', 'never'],
    'computed-property-spacing': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'space-before-function-paren': ['error', 'never'],
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
  }
}
