import type { User } from "./user.repository.interface.js";
import type { Currency } from "./user-balance.repository.interface.js";

export type TransactionStatus =
  | "pending"
  | "approved"
  | "cancelled"
  | "processed";

export interface Transaction {
  id: number;
  description: string;
  author: User;
  payer: User;
  payees: User[];
  status: TransactionStatus;
  amount: number;
  currency: Currency;
  serverId: string;
  channelId: string;
  messageId: string;
  createdAt: Date;
}

export interface CreateTransactionParams {
  description: string;
  authorUserId: number;
  payerUserId: number;
  status: TransactionStatus;
  amount: number;
  currency: Currency;
  serverId: string;
  channelId: string;
  messageId: string;
}
