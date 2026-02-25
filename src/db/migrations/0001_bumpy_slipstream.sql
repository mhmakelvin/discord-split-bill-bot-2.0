ALTER TABLE "transactionPayees" RENAME TO "transaction_payees";--> statement-breakpoint
ALTER TABLE "userBalances" RENAME TO "user_balances";--> statement-breakpoint
ALTER TABLE "transaction_payees" RENAME COLUMN "transactionId" TO "transaction_id";--> statement-breakpoint
ALTER TABLE "transaction_payees" RENAME COLUMN "payeeUserId" TO "payee_user_id";--> statement-breakpoint
ALTER TABLE "transactions" RENAME COLUMN "authorUserId" TO "author_user_id";--> statement-breakpoint
ALTER TABLE "transactions" RENAME COLUMN "payerUserId" TO "payer_user_id";--> statement-breakpoint
ALTER TABLE "transactions" RENAME COLUMN "serverId" TO "server_id";--> statement-breakpoint
ALTER TABLE "transactions" RENAME COLUMN "channelId" TO "channel_id";--> statement-breakpoint
ALTER TABLE "transactions" RENAME COLUMN "messageId" TO "message_id";--> statement-breakpoint
ALTER TABLE "transactions" RENAME COLUMN "createAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "user_balances" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "serverId" TO "server_id";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "isActive" TO "is_active";--> statement-breakpoint
ALTER TABLE "user_balances" DROP CONSTRAINT "userBalances_userId_currency_unique";--> statement-breakpoint
ALTER TABLE "transaction_payees" DROP CONSTRAINT "transactionPayees_transactionId_transactions_id_fk";
--> statement-breakpoint
ALTER TABLE "transaction_payees" DROP CONSTRAINT "transactionPayees_payeeUserId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_authorUserId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_payerUserId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_balances" DROP CONSTRAINT "userBalances_userId_users_id_fk";
--> statement-breakpoint
DROP INDEX "server_user_idx";--> statement-breakpoint
ALTER TABLE "transaction_payees" DROP CONSTRAINT "transactionPayees_transactionId_payeeUserId_pk";--> statement-breakpoint
ALTER TABLE "transaction_payees" ADD CONSTRAINT "transaction_payees_transaction_id_payee_user_id_pk" PRIMARY KEY("transaction_id","payee_user_id");--> statement-breakpoint
ALTER TABLE "transaction_payees" ADD CONSTRAINT "transaction_payees_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_payees" ADD CONSTRAINT "transaction_payees_payee_user_id_users_id_fk" FOREIGN KEY ("payee_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payer_user_id_users_id_fk" FOREIGN KEY ("payer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_balances" ADD CONSTRAINT "user_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "server_user_idx" ON "users" USING btree ("server_id","user_id");--> statement-breakpoint
ALTER TABLE "user_balances" ADD CONSTRAINT "user_balances_user_id_currency_unique" UNIQUE("user_id","currency");