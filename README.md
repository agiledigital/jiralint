# jiralint

![CI Status](https://github.com/agiledigital-labs/jiralint/actions/workflows/build-test.yml/badge.svg)
[![deepcode](https://www.deepcode.ai/api/gh/badge?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybTEiOiJnaCIsIm93bmVyMSI6ImFnaWxlZGlnaXRhbC1sYWJzIiwicmVwbzEiOiJqaXJhbGludCIsImluY2x1ZGVMaW50IjpmYWxzZSwiYXV0aG9ySWQiOjI4ODQyLCJpYXQiOjE2MTk3NjA0MzB9.anWHb7UXuFHml-A38LNTusPapunRivmNYSYJq1lu_2c)](https://www.deepcode.ai/app/gh/agiledigital-labs/jiralint/_/dashboard?utm_content=gh%2Fagiledigital-labs%2Fjiralint)

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
