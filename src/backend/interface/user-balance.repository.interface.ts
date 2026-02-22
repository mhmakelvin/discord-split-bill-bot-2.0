export type Currency = "USD" | "JPY" | "HKD";

export interface UserBalance {
  id: number;
  userId: number;
  balance: number;
  currency: Currency;
}
