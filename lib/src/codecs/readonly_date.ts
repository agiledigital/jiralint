import * as T from "io-ts";
import * as ITT from "io-ts-types";
import { readonlyDate, ReadonlyDate } from "readonly-types/dist";

/* eslint-disable no-restricted-globals*/
/**
 * Codec to convert between a `Date` and a `ReadonlyDate`.
 */
// eslint-disable-next-line functional/prefer-immutable-types
export const readonlyDateFromDate = new T.Type<ReadonlyDate, string, unknown>(
  "readonly date",
  (u): u is ReadonlyDate => u instanceof Date,
  // eslint-disable-next-line functional/prefer-immutable-types
  (u, context) =>
    typeof u === "string"
      ? ITT.DateFromISOString.decode(u)
      : u instanceof Date
      ? T.success(readonlyDate(u))
      : T.failure(u, context, "Not a Date or string"),
  (a) => a.toISOString()
);

/* eslint-enable no-restricted-globals*/
