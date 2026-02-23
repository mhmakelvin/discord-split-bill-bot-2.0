import type { UserBalance } from "./user-balance.repository.interface.js";

export interface User {
  id: number;
  name: string;
  serverId: string;
  userId: string;
  balances: UserBalance[];
  isActive: boolean;
}

export interface CreateUserParams {
  name: string;
  serverId: string;
  userId: string;
  isActive?: boolean;
}
