import pg from "pg";
import { logger } from "../observability/logger.js";

const { Pool } = pg;

export const postgresPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function connectToPostgres() {
  const retries = 5;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await postgresPool.query("SELECT 1");

      logger.info("Worker connected to Postgres");

      return;
    } catch (error) {
      logger.warn(
        {
          attempt,
          error,
        },
        "Worker failed to connect to Postgres. Retrying...",
      );

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  throw new Error("Worker could not connect to Postgres");
}
