import * as T from "io-ts";
import * as ITT from "io-ts-types";
import { readonlyDate, ReadonlyDate } from "readonly-types";

/**
 * Codec to convert between a `Date` and a `ReadonlyDate`.
 */
export const readonlyDateFromDate = new T.Type<ReadonlyDate, string, unknown>(
  "readonly date",
  (u): u is ReadonlyDate => u instanceof Date,
  (u, context) =>
    typeof u === "string"
      ? ITT.DateFromISOString.decode(u)
      : u instanceof Date
      ? T.success(readonlyDate(u))
      : T.failure(u, context, "Not a Date or string"),
  (a) => a.toISOString()
);
