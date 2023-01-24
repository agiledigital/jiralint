# jiralint

![CI Status](https://github.com/agiledigital/jiralint/actions/workflows/build-test-release.yml/badge.svg)

Contains simple issue checks that can be applied to individual issues and a bare-bones CLI tool for applying them.

## Build

`npm` is used to manage dependencies and build the code.
### Tooling Dependencies

* [npm](https://www.npmjs.com/get-npm) for building and testing.
* [nvm](https://github.com/nvm-sh/nvm#deeper-shell-integration) for automatic node version switching (optional).
* A unix shell like bash or zsh. The examples below all assume such a shell. If you're using something else (e.g. Windows cmd) you'll need to either translate in your head or move to a unix shell.

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
4. Run `jiralint`:
```sh
cli/dist/jiralint --help
```

## Jira authentication

### 1. OAuth

To use OAuth, you need to create a
[consumer key/secret pair](https://developer.atlassian.com/server/jira/platform/oauth/).
The consumer secret will be in the form of a PEM file and you need to pass it to
the command line base64 encoded in a single line. See the examples below. Note
that you'll need administrator privileges to create the consumer secret, but
then everyone in your organisation can use it to authenticate with their own
identity.

Once you have a consumer key and secret, you can begin the OAuth authentication
flow to get the access token and secret you need for further commands. To do
this, run the following command:


```sh
cli/dist/jiralint auth -h [JIRA HOST] --cs $(echo "
-----BEGIN PRIVATE KEY-----
...
...
...
-----END PRIVATE KEY-----" | base64 -w0)
```

Follow the instructions and you'll receive the accessToken and accessSecret. You
can use this to run further `jiralint` commands. For example, to search Jira:

```sh
cli/dist/jiralint search -h [JIRA HOST] -j "project=MF order by created" \
  -t [ACCESS TOKEN] -s [ACCESS SECRET] --cs $(echo "
-----BEGIN PRIVATE KEY-----
...
...
...
-----END PRIVATE KEY-----" | base64 -w0)
```

### 2. Personal Access Token

If you can't get ahold of a consumer key/secret pair, your next best option is
to use a personal access token. For instructions on how to create one of these,
see:

  https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html

Once you have your personal access token, you're ready to start using
`jiralint`. You can search Jira like this:

```sh
cli/dist/jiralint search -h [JIRA HOST] -j "project=MF order by created" \
  --jira.personalAccessToken [PERSONAL ACCESS TOKEN]
```

### 3. User Credentials

We recommend using one of the previous two options. However, if you want to
quickly run `jiralint` without having to create any extra secrets, you can use
your login credentials directly:

```sh
cli/dist/jiralint search -h [JIRA HOST] -j "project=MF order by created" \
  --jira.username [USERNAME] --jira.password [PASSWORD]
```

### .jiralintrc

To save time setting command-line parameters, you can configure `jiralint` using
the `.jiralintrc` configuration file. This file will be resolved starting from
your current working directory and searching up the file tree until a
`.jiralintrc` file is (or isn’t) found.

* Common Parameters:
  * __jiraProtocol__: the protocol to use to connect to Jira - http or https
  * __jiraHost__: the Jira hostname - e.g. jira.example.com
  * __qualityFieldName__: the name of the field to store the quality in - customfield_12345
  * __qualityReasonFieldName__: the name of the field to store the quality in - customfield_12346
* OAuth connection:
  * __jiraConsumerKey__: the name of the consumer secret you created in Jira
  * __jiraConsumerSecret__: the consumer secret you created in Jira
  * __accessToken__: the access token you crated with `jiralint auth`
  * __accessSecret__: the access secret you crated with `jiralint auth`
* Personal access token connection:
  * __personalAccessToken__: the personal access token you created in Jira
* User credentials connection:
  * __username__: your jira username
  * __password__: your jira password

If you set all of the common parameters and a full set of connection parameters,
you can now run jiralint search like this:

```sh
cli/dist/jiralint search -j "project=MF order by created"
```

#### Example OAuth `.jiralintrc`

```json
{
  "jiraConsumerSecret": "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCllvdXIgamlyYSBjb25zdW1lciBrZXkgd2lsbCBnbyBoZXJlCk1jRy9vU1Y1ajdQYjc0OHNjaEFMMEQ3NHlRbGZ6TDc0WXk5b3pnRUhxMFdnY1haM0tiQjVUcktjSk1zc2w2L2YKWC9lZzlQRmJORnY2WU0xZjNtSFBTVGM0TjZaY2JJM0szRHVvMm1YN0JYaVhUQVRXYXArL0dTN3RnUW5wNkpMYwo1RW1SbWM1cFJxTkE5cTBZOVZNWDh3d1dXWXNKRnMveGk0MCt6eXZFUHpZMCtEVnpIb0kxS0VQb0x5aGpPZXFYCkxTeFdZbnpUaXlwY0NucTdQaUJxT0FueW90QnJsb2lqakNsT1lLWjJ0QVJjaWRWdlN5VHZMR1ZNbk9NaE1YckcKbDZEUHFGOE1FUXNPMytXMTc2NHNBS1dMK25zNE5jRmpSL2U4L2NDN01XS01IZEdESS80cEd6bE5uOWZxV0tCMApEcDM0WkRqRTV5NXl1amRocmV4bGJyOEZDN2dPb0k4K2QwditaL0pCNjZUeVlCZzJvL0tuMjh3QkRoVHZweGZoCi9wQWxuTnVKZHpqeFlFZm91OVFOVENzL2F4TVNnUTF5TEVDZXdyTkY4bnduRHdPYkVPMndTcXM4U2FjNDZJUTMKL2pJU3hjNHZLT1lvT2dqRTZ5b0xCWjhSVUIvZXJGT2JUZUtHekRvM09sZzNaRVBWSjI1K2ErQmZsUXhIRFMxTApqR3lMSVVUZzQvdkVpQlUrelJnZlE0UVZPYzBYTElVcFhEcVFhOE9hSGx6YXJjYXJGMEZaWldnNXBhYklnVGRtCjZGbTFDNDhBS3lISzFDcG5ibU92NTV5d05QaWpINHhpVEh4RHZNbkVPQTRZaC9GU1c2a2lsMmZHQWMrUTZ6ZkEKaWx6bytqbWRza0lROUM3YkgzTmNlejhMbFRPUUxnVUFmRHNYTitndkxKSk1meUU1YUVmY0x6ZVJvMldlNyt3agpyNGpFUU1vSHFSVmtHOHVOMWlnQzljNERuMTJBbXF1bDhtaytuV3B0aXp4SDNuT016Z0xrNUhzOFlhNldwSldKCjdDRFV1M01vWnV4WVA1QlVySjJoZVBqOTY4dHVJUklRZ3F4UjlxaWt3WXdVemVBWXFZek9uUE10OWd5TXZ4MG0KLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQo=",
  "accessToken": "VPnyjB8tMq0oquF3BxlNVFspDEHwo72Q",
  "accessSecret": "hMBOoXyDdtyhodR1rQaWKyrcmOMWKiMO",
  "jiraHost": "jira.example.com",
  "qualityFieldName": "customfield_12345",
  "qualityReasonFieldName": "customfield_12346"
}
```

#### Example Personal Access Token `.jiralintrc`

```json
{
  "personalAccessToken": "uF3BxlNVFsVPnyjB8tMq0oqpDEHwo72Q",
  "jiraHost": "jira.example.com",
  "qualityFieldName": "customfield_12345",
  "qualityReasonFieldName": "customfield_12346"
}
```

#### Example User Credentials `.jiralintrc`

Note that Cloud Jira access using usernames and passwords is now deprecated. Furthermore, a specific quality and quality reason field has been added for Jiralint usage. When trying to access Jira Cloud using user credentials, use the following:

```json
{
    "username": "[username]:",
    "password": "[API token]",
    "jiraHost": "agiledigital.atlassian.net",
    "qualityFieldName": "customfield_10147",
    "qualityReasonFieldName": "customfield_10148"
  }
```

You can create a Jira API token for your account [here](https://id.atlassian.com/manage-profile/security/api-tokens). Note that the colon after your login email is neccesary. Below is how you can sign in using a standard username and password via OnPrem

```json
{
  "username": "username",
  "password": "password",
  "jiraHost": "jira.example.com",
  "qualityFieldName": "customfield_12345",
  "qualityReasonFieldName": "customfield_12346"
}
```
