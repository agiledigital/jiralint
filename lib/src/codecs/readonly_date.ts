import * as T from "io-ts";
import * as ITT from "io-ts-types";
import { readonlyDate, ReadonlyDate } from "readonly-types/dist";

/* eslint-disable no-restricted-globals, @typescript-eslint/ban-types */
/**
 * Codec to convert between a `Date` and a `ReadonlyDate`.
 */
export const readonlyDateFromDate = new T.Type<ReadonlyDate, Date, Date>(
  "readonly date",
  (u): u is ReadonlyDate => u instanceof Date,
  (u) => T.success(readonlyDate(u)),
  (a) => new Date(a.valueOf())
);
/* eslint-enable no-restricted-globals, @typescript-eslint/ban-types */

/**
 * Codec to convert between a ISO string representation of a date and a readonly date.
 */
export const readOnlyDateFromISOString = ITT.DateFromISOString.pipe(
  readonlyDateFromDate,
  "ReadonlyDate from ISO string"
);
