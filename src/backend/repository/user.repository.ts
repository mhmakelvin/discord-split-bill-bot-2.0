import type {
  CreateUserParams,
  User,
} from "../interface/user.repository.interface.js";
import { db } from "@db";
import { users } from "@db/schema.js";
import { and, eq, sql } from "drizzle-orm";
import type { Currency } from "../interface/user-balance.repository.interface.js";
import { userBalances } from "@db/schema.js";
import type { DbType } from "@db/index.js";

export class UserRepository {
  private db: DbType = db;

  async create({
    tx = this.db,
    params,
  }: {
    tx?: DbType;
    params: CreateUserParams;
  }): Promise<User> {
    const [user] = await tx.insert(users).values(params).returning();
    return user;
  }

  async update({
    tx = this.db,
    id,
    params,
  }: {
    tx?: DbType;
    id: number;
    params: Partial<CreateUserParams>;
  }): Promise<User> {
    const [user] = await tx
      .update(users)
      .set(params)
      .where(eq(users.id, id))
      .returning();

    if (!user) throw new Error(`User with id ${id} not found`);
    return user;
  }

  async findById({
    tx = this.db,
    id,
  }: {
    tx?: DbType;
    id: number;
  }): Promise<User | null> {
    const user = await tx.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        balances: true,
      },
    });
    return user ?? null;
  }

  async findByServerAndUserId({
    tx = this.db,
    params: { serverId, userId }, // Destructure serverId/userId from 'params'
  }: {
    tx?: DbType;
    params: { serverId: string; userId: string }; // Define the key 'params'
  }): Promise<User | null> {
    const user = await tx.query.users.findFirst({
      where: and(eq(users.serverId, serverId), eq(users.userId, userId)),
      with: {
        balances: true,
      },
    });
    return user ?? null;
  }

  async findUsersByServerAndUserIdList({
    tx = this.db,
    list,
  }: {
    tx?: DbType;
    list: { serverId: string; userId: string }[];
  }): Promise<User[]> {
    return await tx.query.users.findMany({
      where: sql`(${users.serverId}, ${users.userId}) IN ${sql.raw(
        `(${list.map((i) => `('${i.serverId}', '${i.userId}')`).join(",")})`,
      )}`,
      with: {
        balances: true,
      },
    });
  }

  async updateBalance({
    tx = this.db,
    params: { userId, amount, currency },
  }: {
    tx?: DbType;
    params: { userId: number; amount: number; currency: Currency };
  }): Promise<void> {
    await tx
      .insert(userBalances)
      .values({
        userId: userId,
        currency: currency,
        balance: amount,
      })
      .onConflictDoUpdate({
        target: [userBalances.userId, userBalances.currency],
        set: {
          balance: sql`${userBalances.balance} + ${amount}`,
        },
      });
  }

  async bulkUpdateBalance({
    tx = this.db,
    params: { userList, amount, currency },
  }: {
    tx?: DbType;
    params: {
      userList: { userId: number }[];
      amount: number;
      currency: Currency;
    };
  }): Promise<void> {
    const values = userList.map((user) => ({
      userId: user.userId,
      currency: currency,
      balance: amount,
    }));

    await tx
      .insert(userBalances)
      .values(values)
      .onConflictDoUpdate({
        target: [userBalances.userId, userBalances.currency],
        set: {
          balance: sql`${userBalances.balance} + EXCLUDED.balance`,
        },
      });
  }
}
