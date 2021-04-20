# jiralint

Contains simple issue checks that can be applied to individual issues and a bare-bones CLI tool for applying them.

## Build

`npm` is used to manage dependencies and build the code. To build:
### Dependencies:

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
4. Export environment variables:
```
export JIRA_USER_NAME=[your username]
```
5. Run:
```
JIRA_PASSWORD=[your password] dist/jiralint search -j "project=MF order by created"
```
