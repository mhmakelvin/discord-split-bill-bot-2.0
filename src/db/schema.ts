import { relations } from "drizzle-orm";
import {
  serial,
  pgTable,
  boolean,
  varchar,
  integer,
  timestamp,
  pgEnum,
  primaryKey,
  unique,
  index,
} from "drizzle-orm/pg-core";

export const transactionStatus = pgEnum("transaction_status", [
  "pending",
  "approved",
  "cancelled",
  "processed",
]);

export const currency = pgEnum("currency", ["USD", "JPY", "HKD"]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 256 }).notNull(),
    serverId: varchar("server_id", { length: 256 }).notNull(),
    userId: varchar("user_id", { length: 256 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => ({
    serverUserIdx: index("server_user_idx").on(table.serverId, table.userId),
  }),
);

export const userBalances = pgTable(
  "user_balances",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    balance: integer("balance").notNull().default(0),
    currency: currency("currency").notNull(),
  },
  (table) => [unique().on(table.userId, table.currency)],
);

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  description: varchar("description", { length: 256 }).notNull(),
  authorUserId: integer("author_user_id")
    .notNull()
    .references(() => users.id),
  payerUserId: integer("payer_user_id")
    .notNull()
    .references(() => users.id),
  status: transactionStatus("status").notNull().default("pending"),
  amount: integer("amount").notNull(),
  currency: currency("currency").notNull(),
  serverId: varchar("server_id", { length: 256 }).notNull(),
  channelId: varchar("channel_id", { length: 256 }).notNull(),
  messageId: varchar("message_id", { length: 256 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactionPayees = pgTable(
  "transaction_payees",
  {
    transactionId: integer("transaction_id")
      .notNull()
      .references(() => transactions.id),
    payeeUserId: integer("payee_user_id")
      .notNull()
      .references(() => users.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.transactionId, t.payeeUserId] }),
  }),
);

// User Relations
export const userRelations = relations(users, ({ many }) => ({
  balances: many(userBalances),
}));

// User Balance Relations
export const userBalanceRelations = relations(userBalances, ({ one }) => ({
  user: one(users, {
    fields: [userBalances.userId],
    references: [users.id],
  }),
}));

// Transaction Relations
export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    author: one(users, {
      fields: [transactions.authorUserId],
      references: [users.id],
      relationName: "author",
    }),
    payer: one(users, {
      fields: [transactions.payerUserId],
      references: [users.id],
      relationName: "payer",
    }),
    payees: many(transactionPayees),
  }),
);

// Transaction Payees Relations
export const transactionPayeeRelations = relations(
  transactionPayees,
  ({ one }) => ({
    transaction: one(transactions, {
      fields: [transactionPayees.transactionId],
      references: [transactions.id],
    }),
    user: one(users, {
      fields: [transactionPayees.payeeUserId],
      references: [users.id],
    }),
  }),
);
