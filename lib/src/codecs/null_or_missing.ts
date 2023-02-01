import * as T from "io-ts";
import * as ITT from "io-ts-types";

/**
 * Converts a codec into one that treats a missing property or null value as undefined.
 * @param t the type of the property - if it is supplied and not null.
 * @returns a codec that will treat missing property or null value as undefined.
 */
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export const nullOrMissingToUndefined = <P, O = P>(t: T.Type<P, O>) =>
  ITT.fromNullable(T.union([t, T.readonly(T.undefined)]), undefined);
