export interface User {
  id: number;
  name: string;
  serverId: string;
  userId: string;
  isActive: boolean;
}

export interface CreateUserParams {
  name: string;
  serverId: string;
  userId: string;
  isActive?: boolean;
}
