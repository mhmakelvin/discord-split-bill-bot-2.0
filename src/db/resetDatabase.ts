import { sql } from "drizzle-orm";
import { db } from "@db";

async function resetData() {
  try {
    console.log("Clearing the DB...");

    const query = sql`
      DO $$ 
      DECLARE 
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
          END LOOP;
      END $$;
    `;

    await db.execute(query);
    process.exit(0);
  } catch (error) {
    console.error("Failed to clear DB:", error);
    process.exit(1);
  }
}

resetData();
