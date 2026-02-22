import { db } from "@db";
import { eq } from "drizzle-orm";
import type {
  CreateTransactionParams,
  Transaction,
} from "../interface/transaction.repository.interface.js";
import { transactionPayees, transactions } from "@db/schema.js";
import type { DbType } from "@db/index.js";

export class TransactionRepository {
  private db: DbType = db;

  async create({
    tx = this.db,
    params,
  }: {
    tx?: DbType;
    params: CreateTransactionParams;
  }): Promise<Transaction> {
    const [transaction] = await tx
      .insert(transactions)
      .values(params)
      .returning();
    return transaction;
  }

  async update({
    tx = this.db,
    id,
    params,
  }: {
    tx?: DbType;
    id: number;
    params: Partial<CreateTransactionParams>;
  }): Promise<Transaction> {
    const [transaction] = await tx
      .update(transactions)
      .set(params)
      .where(eq(transactions.id, id))
      .returning();

    if (!transaction) throw new Error(`Transaction with id ${id} not found`);
    return transaction;
  }

  async findTransactionsByMessageId({
    tx = this.db,
    messageId,
  }: {
    tx?: DbType;
    messageId: string;
  }): Promise<Transaction[]> {
    return await tx.query.transactions.findMany({
      where: eq(transactions.messageId, messageId),
      with: {
        author: true,
        payer: true,
        payees: {
          with: {
            user: true,
          },
        },
      },
    });
  }

  async createTransactionPayeeRelations({
    tx = this.db,
    params,
  }: {
    tx?: DbType;
    params: { transactionId: number; payeeUserId: number }[];
  }) {
    await tx.insert(transactionPayees).values(params).returning();
  }
}
