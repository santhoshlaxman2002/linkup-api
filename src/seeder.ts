import fs from "fs";
import path from "path";
import { Pool } from "pg";
import dotenv from "dotenv";
import { logger } from "./utils";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const MIGRATIONS_DIR = path.join(__dirname, "..", "migrations");

async function runMigrations() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Ensure the migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        run_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2️⃣ Get applied migrations
    const appliedMigrationsResult = await client.query("SELECT name FROM migrations");
    const appliedMigrations = appliedMigrationsResult.rows.map((r) => r.name);

    // 3️⃣ Read migration files from the folder
    const migrationFiles = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith(".sql"))
      .sort(); // ensure 1_.. runs before 2_..

    for (const file of migrationFiles) {
      if (!appliedMigrations.includes(file)) {
        const filePath = path.join(MIGRATIONS_DIR, file);
        const sql = fs.readFileSync(filePath, "utf-8");

        logger.info(`🚀 Running migration: ${file}`);
        await client.query(sql);
        await client.query("INSERT INTO migrations (name) VALUES ($1)", [file]);
        logger.info(`✅ Migration completed: ${file}`);
      } else {
        logger.info(`⚡ Skipping already applied migration: ${file}`);
      }
    }

    await client.query("COMMIT");
    logger.info("🎉 All migrations applied successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("❌ Migration failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
