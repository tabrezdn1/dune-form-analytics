module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Basic code quality rules (avoid complex rules that need extra plugins)
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
};
