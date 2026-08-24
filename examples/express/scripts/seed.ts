import { openDb, seedProducts } from "../src/db.js";

const db = openDb();
const created = seedProducts(db);
console.log(`Seeded ${created} products`);
