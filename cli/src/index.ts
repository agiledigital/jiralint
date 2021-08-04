import yargs from "yargs";
import auth from "./scripts/auth";
import rate from "./scripts/rate";
import search from "./scripts/search";

/**
 * Dynamic type for global arguments. This needs to be its own as we use a
 * require below to import all the commands
 */
export type RootCommand = typeof rootCommand;

/**
 * Add global arguments here using the .option function.
 * E.g. const rootCommand = yargs.option('example', {type: 'string'});
 */
const rootCommand = yargs;

auth(rootCommand);
rate(rootCommand);
search(rootCommand);

// eslint-disable-next-line functional/no-expression-statement
rootCommand.demandCommand().strict().help().argv;
