import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const dbPath = join(root, "db.sqlite3");
export const initialDbPath = join(root, "data", "initial.sqlite3");

type SqliteDb = InstanceType<typeof Database>;

export type Product = {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: string;
  currency: string;
};

export type Order = {
  id: number;
  reference: string;
  product_id: number;
  amount: string;
  currency: string;
  status: string;
};

export type Transfer = {
  id: number;
  reference: string;
  amount: string;
  currency: string;
  destination: string;
  status: string;
};

export const DEMO_PRODUCTS = [
  { sku: "DEMO-SHIRT", name: "Demo T-shirt", description: "Cotton demo shirt", price: "25.00", currency: "USD" },
  { sku: "DEMO-COFFEE", name: "Demo coffee", description: "A cup of demo coffee", price: "5.00", currency: "USD" },
  { sku: "DEMO-BUNDLE", name: "Demo bundle", description: "Shirt plus coffee", price: "10.00", currency: "USD" },
];

export function openDb(): SqliteDb {
  if (!existsSync(dbPath) && existsSync(initialDbPath)) {
    copyFileSync(initialDbPath, dbPath);
  }
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price TEXT NOT NULL,
      currency TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      product_id INTEGER NOT NULL,
      amount TEXT NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      amount TEXT NOT NULL,
      currency TEXT NOT NULL,
      destination TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending'
    );
  `);
  return db;
}

export function seedProducts(db: SqliteDb): number {
  let created = 0;
  const insert = db.prepare(
    "INSERT INTO products (sku, name, description, price, currency) VALUES (@sku, @name, @description, @price, @currency)",
  );
  const find = db.prepare("SELECT id FROM products WHERE sku = ?");
  for (const item of DEMO_PRODUCTS) {
    if (find.get(item.sku) === undefined) {
      insert.run(item);
      created += 1;
    }
  }
  return created;
}

export function exportInitialDb(): void {
  mkdirSync(dirname(initialDbPath), { recursive: true });
  copyFileSync(dbPath, initialDbPath);
}
