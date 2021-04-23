import { readdirSync } from "fs";
import { join } from "path";
import yargs from "yargs";

/**
 * Dynamic type for global arguments. This needs to be its own as we use a
 * require below to import all the commands
 */
export type RootCommand = typeof rootCommand;

// eslint-disable-next-line require-unicode-regexp
const javaScriptFileMatch = new RegExp(/^[A-z0-9/-]+\.js$/);

// Only finds scripts in top level
const directorySearch = (localDirectory: string): ReadonlyArray<string> =>
  readdirSync(join(__dirname, localDirectory), { withFileTypes: true })
    .map(({ name }) => name)
    .filter((value) => javaScriptFileMatch.test(value))
    // Weirdness with string concat as path resolves the ./ and drops it
    // from the final string
    .map((name) => `./${join(localDirectory, name)}`);

/**
 * Add global arguments here using the .option function.
 * E.g. const rootCommand = yargs.option('example', {type: 'string'});
 */
const rootCommand = yargs;

// eslint-disable-next-line @typescript-eslint/no-unsafe-return, functional/no-expression-statement, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-call
directorySearch("scripts").forEach((path) => require(path)(rootCommand));

// eslint-disable-next-line functional/no-expression-statement
rootCommand.demandCommand().strict().help().argv;
