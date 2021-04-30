# jiralint

![CI Status](https://github.com/agiledigital-labs/jiralint/actions/workflows/build-test.yml/badge.svg)

Contains simple issue checks that can be applied to individual issues and a bare-bones CLI tool for applying them.

## Build

`npm` is used to manage dependencies and build the code.
### Tooling Dependencies

[npm](https://www.npmjs.com/get-npm) for building and testing.

### Step-by-step instructions

1. Install all tooling dependencies.
2. Install code dependencies:
```
npm install
```
3. Build:
```
npm run build
```
4. Get your access token.
```
lib/dist/jiralint auth
```
5. Follow the instructions to authorise Jira Lint then take a note of the access token and access secret.
6. Run:
```
lib/dist/jiralint search -j "project=MF order by created" -t [ACCESS TOKEN] -s [ACCESS SECRET]
```
