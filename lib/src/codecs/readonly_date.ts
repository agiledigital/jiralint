import * as T from "io-ts";
import * as ITT from "io-ts-types";
import * as E from "fp-ts/Either";
import { readonlyDate, ReadonlyDate } from "readonly-types/dist";

/* eslint-disable no-restricted-globals, @typescript-eslint/ban-types*/
/**
 * Codec to convert between a `Date` and a `ReadonlyDate`.
 */
export const readonlyDateFromDate = new T.Type<ReadonlyDate, Date, Date>(
  "readonly date",
  (u): u is ReadonlyDate => u instanceof Date,
  (u) => T.success(readonlyDate(u)),
  (a) => new Date(a.valueOf())
);

/**
 * Codec to convert between a ISO string representation of a date and a readonly date.
 */
export const readOnlyDateFromISOString = ITT.DateFromISOString.pipe(
  readonlyDateFromDate,
  "ReadonlyDate from ISO string"
);

export const ReadonlyDateC = new T.Type<ReadonlyDate, Date, Date>(
  "ReadonlyDate",
  ITT.date.is,
  (u: Date) => E.of(readonlyDate(u)),
  (a) => new Date(a.valueOf())
);

/**
 * Identity codec to convert between a readonly date and a readonly date. Will work if input is either date or readonly * date.
 */
export const dateToDate = ITT.date.pipe(
  ReadonlyDateC,
  "ReadonlyDate from Date"
);

/* eslint-enable no-restricted-globals, @typescript-eslint/ban-types*/
