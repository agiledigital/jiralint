import { isLeft } from "fp-ts/lib/These";
import { readonlyDateFromDate } from "./readonly_date";
import * as ITT from "io-ts-types";
import fc from "fast-check";

describe("decoding a Date", () => {
  it("should decode a date to a readonly date", () => {
    fc.assert(
      // eslint-disable-next-line functional/prefer-immutable-types
      fc.property(fc.date(), (d) => {
        // Given a date,

        // When it is decoded to a readonly date.
        const actual = readonlyDateFromDate.decode(d);

        // Then it should have been successfully decoded.
        if (isLeft(actual)) {
          throw new Error(
            `[${JSON.stringify(actual, null, 2)}] is unexpectedly left.`
          );
        } else {
          // And be equivalent to the the original date.
          // eslint-disable-next-line jest/no-conditional-expect
          expect(actual.right.valueOf()).toEqual(d.valueOf());
        }
      })
    );
  });
});

describe("decoding a string", () => {
  it("should decode an ISO formatted string to a readonly date", () => {
    fc.assert(
      // eslint-disable-next-line functional/prefer-immutable-types
      fc.property(fc.date(), (d) => {
        // Given a date,

        // That has been encoded as a ISO string.
        const isoDate = ITT.DateFromISOString.encode(d);

        // When it is decoded to a readonly date.
        const actual = readonlyDateFromDate.decode(isoDate);

        // Then it should have been successfully decoded.
        if (isLeft(actual)) {
          throw new Error(
            `[${JSON.stringify(actual, null, 2)}] is unexpectedly left.`
          );
        } else {
          // And be equivalent to the the original date.
          // eslint-disable-next-line jest/no-conditional-expect
          expect(actual.right.valueOf()).toEqual(d.valueOf());
        }
      })
    );
  });
});
