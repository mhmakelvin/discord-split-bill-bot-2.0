import { db } from "@db";
import { eq } from "drizzle-orm";
import type {
  CreateTransactionParams,
  Transaction,
} from "../interface/transaction.repository.interface.js";
import { transactionPayees, transactions } from "@db/schema.js";
import type { DbType } from "@db/index.js";

function simplifyTransactionObject(transaction: any): Transaction {
  return {
    ...transaction,
    payees: transaction.payees?.map((p: any) => p.user) ?? [],
  };
}

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
    return simplifyTransactionObject(transaction);
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
    return simplifyTransactionObject(transaction);
  }

  async findTransactionsByMessageId({
    tx = this.db,
    messageId,
  }: {
    tx?: DbType;
    messageId: string;
  }): Promise<Transaction[]> {
    const result = await tx.query.transactions.findMany({
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

    return result?.map(simplifyTransactionObject);
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
