import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SQLite database connection
// Use DATABASE_PATH environment variable for persistent disk on Render, or local path in development
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');

// Ensure directory exists for database file (important for Render persistent disk)
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false, // Set to console.log to see SQL queries
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  }
});

export default sequelize;

