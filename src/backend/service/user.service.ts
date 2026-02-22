import type { Currency } from "../interface/user-balance.repository.interface.js";
import { UserRepository } from "../repository/user.repository.js";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async createUser(serverId: string, userId: string, name: string) {
    return await this.userRepository.create({
      params: {
        serverId,
        userId,
        name,
        isActive: true,
      },
    });
  }

  async updateUser(id: number, name?: string, isActive?: boolean) {
    return await this.userRepository.update({
      id,
      params: {
        ...(name !== undefined && { name }),
        ...(isActive !== undefined && { isActive }),
      },
    });
  }

  async findUserByServerAndUserId(serverId: string, userId: string) {
    return await this.userRepository.findByServerAndUserId({
      params: {
        serverId,
        userId,
      },
    });
  }

  async updateBalance(
    serverId: string,
    userId: string,
    amount: number,
    currency: Currency,
  ) {
    const user = await this.userRepository.findByServerAndUserId({
      params: {
        serverId,
        userId,
      },
    });

    if (!user)
      throw new Error(
        `User with serverId ${serverId} and userId ${userId} not found`,
      );

    return await this.userRepository.updateBalance({
      params: {
        userId: user.id,
        amount,
        currency,
      },
    });
  }
}
