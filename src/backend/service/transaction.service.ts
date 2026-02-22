import { assert } from "node:console";
import { db } from "../../db/index.js";
import type { Currency } from "../interface/user-balance.repository.interface.js";
import { TransactionRepository } from "../repository/transaction.repository.js";
import { UserRepository } from "../repository/user.repository.js";

export class TransactionService {
  private userRepository: UserRepository;
  private transactionRepository: TransactionRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.transactionRepository = new TransactionRepository();
  }

  async createTransaction(
    author: { serverId: string; userId: string },
    payer: { serverId: string; userId: string },
    payees: { serverId: string; userId: string }[],
    amount: number,
    currency: Currency,
    description: string,
    serverId: string,
    channelId: string,
    messageId: string,
  ) {
    assert(amount > 0, "Amount must be greater than 0");
    assert(payees.length > 0, "At least one payee must be specified");

    await db.transaction(async (tx) => {
      const authorUser = await this.userRepository.findByServerAndUserId({
        tx,
        params: {
          serverId: author.serverId,
          userId: author.userId,
        },
      });

      if (!authorUser) {
        throw new Error(
          `Author user with serverId ${author.serverId} and userId ${author.userId} not found`,
        );
      }

      const payerUser = await this.userRepository.findByServerAndUserId({
        tx,
        params: {
          serverId: payer.serverId,
          userId: payer.userId,
        },
      });

      if (!payerUser) {
        throw new Error(
          `Payer user with serverId ${payer.serverId} and userId ${payer.userId} not found`,
        );
      }

      const payeeUsers =
        await this.userRepository.findUsersByServerAndUserIdList({
          tx,
          list: payees.map((payee) => ({
            serverId: payee.serverId,
            userId: payee.userId,
          })),
        });

      if (payeeUsers.length !== payees.length) {
        throw new Error(
          `Payee users not found: ${payees
            .map((payee) => `${payee.serverId}:${payee.userId}`)
            .join(", ")}`,
        );
      }

      const transaction = await this.transactionRepository.create({
        tx,
        params: {
          authorUserId: authorUser.id,
          payerUserId: payerUser.id,
          description,
          amount,
          currency,
          serverId,
          channelId,
          messageId,
          status: "pending",
        },
      });

      this.transactionRepository.createTransactionPayeeRelations({
        tx,
        params: payeeUsers.map((payeeUser) => ({
          transactionId: transaction.id,
          payeeUserId: payeeUser.id,
        })),
      });
    });
  }

  async approveTransaction(messageId: string) {
    const transactions =
      await this.transactionRepository.findTransactionsByMessageId({
        messageId,
      });

    if (transactions.length <= 0) {
      throw new Error(`Transaction with ID ${messageId} not found`);
    }

    if (transactions.some((transaction) => transaction.status !== "pending")) {
      const status = transactions.find(
        (transaction) => transaction.status !== "pending",
      )?.status;
      throw new Error(
        `Cannot cancel transaction with ID ${messageId} because it is ${status}`,
      );
    }

    await db.transaction(async (tx) => {
      for (const transaction of transactions) {
        await this.transactionRepository.update({
          tx,
          id: transaction.id,
          params: {
            status: "approved",
          },
        });
      }
    });
  }

  async processTransaction(messageId: string) {
    await db.transaction(async (tx) => {
      const transactions =
        await this.transactionRepository.findTransactionsByMessageId({
          tx,
          messageId,
        });

      if (transactions.length <= 0) {
        throw new Error(`Transaction with ID ${messageId} not found`);
      }

      if (
        transactions.some((transaction) => transaction.status !== "approved")
      ) {
        const status = transactions.find(
          (transaction) => transaction.status !== "pending",
        )?.status;
        throw new Error(
          `Cannot cancel transaction with ID ${messageId} because it is ${status}`,
        );
      }

      for (const transaction of transactions) {
        await this.transactionRepository.update({
          tx,
          id: transaction.id,
          params: {
            status: "processed",
          },
        });

        await this.userRepository.updateBalance({
          tx,
          params: {
            userId: transaction.payer.id,
            amount: transaction.amount,
            currency: transaction.currency,
          },
        });

        const payeeAmount = transaction.amount / transaction.payees.length;
        await this.userRepository.bulkUpdateBalance({
          tx,
          params: {
            userList: transaction.payees.map((payee) => ({
              userId: payee.id,
            })),
            amount: -payeeAmount,
            currency: transaction.currency,
          },
        });
      }
    });
  }

  async cancelTransaction(messageId: string) {
    const transactions =
      await this.transactionRepository.findTransactionsByMessageId({
        messageId,
      });

    if (transactions.length <= 0) {
      throw new Error(`Transaction with ID ${messageId} not found`);
    }

    if (transactions.some((transaction) => transaction.status !== "pending")) {
      const status = transactions.find(
        (transaction) => transaction.status !== "pending",
      )?.status;
      throw new Error(
        `Cannot cancel transaction with ID ${messageId} because it is ${status}`,
      );
    }

    await db.transaction(async (tx) => {
      for (const transaction of transactions) {
        await this.transactionRepository.update({
          tx,
          id: transaction.id,
          params: {
            status: "cancelled",
          },
        });
      }
    });
  }
}
