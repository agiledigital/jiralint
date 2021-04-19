import * as T from "io-ts";
import * as ITT from "io-ts-types";
import { compareDesc } from "date-fns";

/**
 * Converts a codec into one that treats a missing property or null value as undefined.
 * @param t the type of the property - if it is supplied and not null.
 * @returns a codec that will treat missing property or null value as undefined.
 */
const nullOrMissingToUndefined = <P>(
  t: T.Type<P>
  // eslint-disable-next-line functional/prefer-readonly-type
): T.UnionC<[T.Type<P, P, unknown>, T.UndefinedC]> =>
  ITT.fromNullable(T.union([t, T.undefined]), undefined);

export const AccountField = "customfield_11410 "; // FIXME should be configurable.

export const Author = T.type({
  name: T.string,
});

export const TicketComment = T.type({
  id: T.string,
  author: Author,
  body: T.string,
  created: ITT.DateFromISOString,
  updated: ITT.DateFromISOString,
});

export const ChangeLog = T.type({
  id: T.string,
  author: Author,
  created: ITT.DateFromISOString,
  items: T.readonlyArray(
    T.type({
      field: T.string,
      fieldtype: T.string,
      from: T.union([T.string, T.null]),
      fromString: T.union([T.string, T.null]),
      to: T.union([T.string, T.null]),
      toString: T.union([T.string, T.null]),
    })
  ),
});

export const Ticket = T.type({
  key: T.string,
  self: T.string,
  fields: T.intersection([
    T.type({
      summary: T.string,
      project: T.type({
        key: T.string,
      }),
      timetracking: ITT.fromNullable(
        T.partial({
          originalEstimateSeconds: T.number,
          timeSpentSeconds: T.number,
          remainingEstimateSeconds: T.number,
          originalEstimate: T.string,
          timeSpent: T.string,
        }),
        {
          originalEstimateSeconds: 0,
          timeSpentSeconds: 0,
          remainingEstimateSeconds: 0,
          originalEstimate: "0d",
          timeSpent: "0d",
        }
      ),
      fixVersions: T.readonlyArray(
        T.type({
          id: T.string,
          name: T.string,
          released: T.boolean,
        })
      ),
      aggregateprogress: T.type({
        progress: nullOrMissingToUndefined(T.number),
        total: nullOrMissingToUndefined(T.number),
        percent: nullOrMissingToUndefined(T.number),
      }),
      issuetype: T.type({
        name: T.string,
      }),
      assignee: T.type({
        name: T.string,
      }),
      status: T.type({
        id: T.string,
        name: T.string,
        statusCategory: T.type({
          id: nullOrMissingToUndefined(T.number),
          name: nullOrMissingToUndefined(T.string),
          colorName: nullOrMissingToUndefined(T.string),
        }),
      }),
      comment: T.type({
        comments: T.readonlyArray(TicketComment),
      }),
    }),
    T.partial({
      account: T.type({
        AccountField: T.type({
          key: T.string,
        }),
      }),
      aggregatetimeestimate: nullOrMissingToUndefined(T.number),
      aggregatetimeoriginalestimate: nullOrMissingToUndefined(T.number),
      aggregatetimespent: nullOrMissingToUndefined(T.number),
    }),
  ]),
  changelog: ITT.fromNullable(
    T.type({
      histories: T.readonlyArray(ChangeLog),
    }),
    {
      histories: [],
    }
  ),
});

export type Ticket = T.TypeOf<typeof Ticket>;

export type TicketComment = T.TypeOf<typeof TicketComment>;

export type TicketChangeLog = T.TypeOf<typeof ChangeLog>;

export const BoardColumn = T.type({
  name: T.string,
  statuses: T.readonlyArray(
    T.type({
      id: T.string,
    })
  ),
});

export type BoardColumn = T.TypeOf<typeof BoardColumn>;

export const Board = T.type({
  id: T.number,
  name: T.string,
  type: T.string,
  columnConfig: T.type({
    columns: T.readonlyArray(BoardColumn),
    constraintType: T.string,
  }),
});

export type Board = T.TypeOf<typeof Board>;

export const BoardSummary = T.type({
  id: T.number,
  name: T.string,
});

export type BoardSummary = T.TypeOf<typeof BoardSummary>;

export type EnhancedTicket = Ticket & {
  readonly board?: Board;
  readonly inProgress: boolean;
  readonly stalled: boolean;
  readonly released: boolean;
  readonly column?: string;
  readonly mostRecentComment?: TicketComment;
  readonly mostRecentTransition?: TicketChangeLog;
  readonly viewLink: string;
};

const columnForTicket = (
  ticket: Ticket,
  board: Board
): BoardColumn | undefined => {
  return board.columnConfig.columns.find((column) =>
    column.statuses.some((status) => status.id === ticket.fields.status.id)
  );
};

const ticketInProgress = (ticket: Ticket, board?: Board): boolean => {
  return board !== undefined
    ? columnForTicket(ticket, board)?.name.toLowerCase() === "in progress"
    : ticket.fields.status.name.toLowerCase() === "in progress";
};

const ticketStalled = (ticket: Ticket, board?: Board): boolean => {
  return board !== undefined
    ? (columnForTicket(ticket, board)?.name ?? "")
        .toLowerCase()
        .startsWith("stalled")
    : ticket.fields.status.name.toLowerCase().startsWith("stalled");
};

export const enhancedTicket = (
  ticket: Ticket,
  viewLink: string,
  board?: Board
): EnhancedTicket => {
  const comments: readonly TicketComment[] = [
    ...ticket.fields.comment.comments,
  ].sort((a, b) => compareDesc(a.created, b.created));

  const mostRecentComment = comments[0];

  const changelogs: readonly TicketChangeLog[] = [
    ...ticket.changelog.histories,
  ].sort((a, b) => compareDesc(a.created, b.created));

  const mostRecentTransition = changelogs.find((changelog) =>
    changelog.items.some(
      (item) => item.field === "status" && item.fieldtype === "jira"
    )
  );

  const released = ticket.fields.fixVersions.some(
    (version) => version.released
  );

  return {
    ...ticket,
    inProgress: ticketInProgress(ticket, board),
    stalled: ticketStalled(ticket, board),
    column:
      board !== undefined ? columnForTicket(ticket, board)?.name : undefined,
    mostRecentComment: mostRecentComment,
    mostRecentTransition: mostRecentTransition,
    released: released,
    viewLink,
  };
};
