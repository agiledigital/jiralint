# jiralint

![CI Status](https://github.com/agiledigital-labs/jiralint/actions/workflows/build-test-release.yml/badge.svg)
[![deepcode](https://www.deepcode.ai/api/gh/badge?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybTEiOiJnaCIsIm93bmVyMSI6ImFnaWxlZGlnaXRhbC1sYWJzIiwicmVwbzEiOiJqaXJhbGludCIsImluY2x1ZGVMaW50IjpmYWxzZSwiYXV0aG9ySWQiOjI4ODQyLCJpYXQiOjE2MTk3NjA0MzB9.anWHb7UXuFHml-A38LNTusPapunRivmNYSYJq1lu_2c)](https://www.deepcode.ai/app/gh/agiledigital-labs/jiralint/_/dashboard?utm_content=gh%2Fagiledigital-labs%2Fjiralint)

Contains simple issue checks that can be applied to individual issues and a bare-bones CLI tool for applying them. For more sophisticated Jira integration, see [jiralint-pulumi](https://github.com/agiledigital-labs/jiralint-pulumi).

## Build

`npm` is used to manage dependencies and build the code.
### Tooling Dependencies

* [npm](https://www.npmjs.com/get-npm) for building and testing.
* [nvm](https://github.com/nvm-sh/nvm#deeper-shell-integration) for automatic node version switching (optional).

### Step-by-step instructions

1. Install all tooling dependencies.
2. Install code dependencies:
```sh
npm install
```
3. Build:
```sh
npm run build
```
4. Get your access token.
```sh
cli/dist/jiralint auth -h [JIRA HOST] --cs $(echo "
-----BEGIN PRIVATE KEY-----
...
...
...
-----END PRIVATE KEY-----" | base64)
```
5. Follow the instructions to authorise Jira Lint then take a note of the access token and access secret.
6. Run:
```sh
cli/dist/jiralint search -h [JIRA HOST] -j "project=MF order by created" -t [ACCESS TOKEN] -s [ACCESS SECRET] --cs $(echo "
-----BEGIN PRIVATE KEY-----
...
...
...
-----END PRIVATE KEY-----" | base64)
```
