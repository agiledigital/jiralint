// FIXME: solicit all or most of these from the CLI user

export const privKey = `-----BEGIN PRIVATE KEY-----
MIICdQIBADANBgkqhkiG9w0BAQEFAASCAl8wggJbAgEAAoGBAN2x/ovMRTUt3qIy
GXRih/RihX4VTHp7FoXz5XtE2EVCv3ghRYAH/mRLAkX0QeRf36/RoXQpnZBc4iiv
vmmogD2tVJCahgjGfLUy9dWnngRyQx2ac4BrQJBwHB0vTWvRLpBeMzBRka8aHF8m
jr08/uYmeaxauIAniVGTftdDYo0FAgMBAAECgYBamMirHJkTuGEI62xXkYR5rGFd
Oxr72p1DtH4NN/8hnrtcPkyGm72sArM1HzJmP3/L++D89Zy8SBjsA5XO29s7loP9
YrVEFHqpj/6w5cHJMpqC6GShodBU8QG1pJUCveSGdyWUdrn1gBdCLXZBrtqhmZw8
wc473tnFBECrv6v6AQJBAPHYApw4fpYCZ+Emnsk8RNzzIMp0dESZVXJ7r2bs7FQD
zex+PRL135BcUjA2nRFk+sFttmlz/UYvmngxZ8H1oMECQQDqrA/ochDCM7ONfcQa
Z1cy8AERJwpoNPWBbzIOtAwRrWdkOouzxk5rU8llEU3ehGh/AnS1f1adAm1GfdJM
83lFAkBt1L7iuZlrgO4yRzrHgzJ28YeLyjVfTg+LLXasFJ8DTLMBWxdbfAQq6HJ+
6N6OHsDuhWfZHk8Ax++r9Cv93xJBAkAry9bgM8GK7Ok6o9kgcF7mw8H/OIEJt7CF
6oG2GsYR2oHsQ7zk3UKvZyCz+wnEWIPECGpNoSlB/jz0pfDEqb/dAkBgVkumDMg2
WopuoPUF1SMVySqvOhaqC96ZL43KN7PXvwK7zNcF88yufnUF0p5s+TbnS7lZsrU0
2VCKlQeBRCWs
-----END PRIVATE KEY-----`;

export const jiraProtocol = "https";

export const jiraHost = "jira.agiledigital.com.au";

export const jiraConsumerKey = "jiralintkey";

export const boardNamesToIgnore: readonly string[] = [
  "delivery management board",
  "copy of",
];

export const accountField = "customfield_11410 ";

export const qualityField = "customfield_12410";

export const qaImpactStatementField = "customfield_10111";
