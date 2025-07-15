import { DataSource } from "typeorm";
import { config } from "dotenv";
import path from "path";

config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "crm_app",
  synchronize: process.env.NODE_ENV === "development",
  dropSchema: process.env.NODE_ENV === "development" && process.env.DROP_SCHEMA === "true",
  logging: process.env.NODE_ENV === "development",
  entities: [path.join(__dirname, "../entities/*.{ts,js}")],
  migrations: [path.join(__dirname, "../migrations/*.{ts,js}")],
  subscribers: [path.join(__dirname, "../subscribers/*.{ts,js}")],
}); 