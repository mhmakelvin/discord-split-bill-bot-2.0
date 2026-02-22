CREATE TYPE "public"."currency" AS ENUM('USD', 'JPY', 'HKD');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'approved', 'cancelled', 'processed');--> statement-breakpoint
CREATE TABLE "transactionPayees" (
	"transactionId" integer NOT NULL,
	"payeeUserId" integer NOT NULL,
	CONSTRAINT "transactionPayees_transactionId_payeeUserId_pk" PRIMARY KEY("transactionId","payeeUserId")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" varchar(256) NOT NULL,
	"authorUserId" integer NOT NULL,
	"payerUserId" integer NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"amount" integer NOT NULL,
	"currency" "currency" NOT NULL,
	"serverId" varchar(256) NOT NULL,
	"channelId" varchar(256) NOT NULL,
	"messageId" varchar(256) NOT NULL,
	"createAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userBalances" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"currency" "currency" NOT NULL,
	CONSTRAINT "userBalances_userId_currency_unique" UNIQUE("userId","currency")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"serverId" varchar(256) NOT NULL,
	"userId" varchar(256) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactionPayees" ADD CONSTRAINT "transactionPayees_transactionId_transactions_id_fk" FOREIGN KEY ("transactionId") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactionPayees" ADD CONSTRAINT "transactionPayees_payeeUserId_users_id_fk" FOREIGN KEY ("payeeUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_authorUserId_users_id_fk" FOREIGN KEY ("authorUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payerUserId_users_id_fk" FOREIGN KEY ("payerUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userBalances" ADD CONSTRAINT "userBalances_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "server_user_idx" ON "users" USING btree ("serverId","userId");