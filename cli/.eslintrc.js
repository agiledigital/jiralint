module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    ecmaVersion: 2018,
    sourceType: "module",
  },
  extends: [
    "typed-fp",
    "plugin:sonarjs/recommended",
    "plugin:jest/recommended",
    "plugin:prettier/recommended",
  ],
  env: {
    "jest/globals": true,
    es6: true,
  },
  plugins: [
    "jest",
    "sonarjs",
    "functional",
    "@typescript-eslint",
    "prettier",
    "total-functions",
  ],
  rules: {
    "functional/no-return-void": "warn",
  },
};
