/**
 * migrate-orders-2025.js
 * Copie test.orders → sweetyx-prod.orders_2025
 * À lancer UNE SEULE FOIS sur le serveur de prod.
 *
 * Usage :
 *   node scripts/migrate-orders-2025.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env.live") });

const BASE_URI = process.env.MONGO_URI
  .replace(/\/sweetyx-prod$/, "")
  .replace(/\/$/, "");

async function migrate() {
  console.log("🔗 Connexion...");
  const srcConn  = await mongoose.createConnection(`${BASE_URI}/test`).asPromise();
  const destConn = await mongoose.createConnection(`${BASE_URI}/sweetyx-prod`).asPromise();

  const src  = srcConn.collection("orders");
  const dest = destConn.collection("orders_2025");

  const docs = await src.find({}).toArray();
  console.log(`📦 ${docs.length} commande(s) trouvée(s) dans test.orders`);

  if (docs.length === 0) {
    console.log("⚠️  Aucune commande à migrer.");
    await srcConn.close();
    await destConn.close();
    return;
  }

  const existingIds = new Set(
    (await dest.find({}, { projection: { _id: 1 } }).toArray())
      .map(d => d._id.toString())
  );

  const toInsert = docs.filter(d => !existingIds.has(d._id.toString()));

  if (toInsert.length === 0) {
    console.log("✅ Toutes les commandes sont déjà dans orders_2025.");
  } else {
    await dest.insertMany(toInsert, { ordered: false });
    console.log(`✅ ${toInsert.length} commande(s) migrées vers sweetyx-prod.orders_2025`);
    if (docs.length - toInsert.length > 0)
      console.log(`   (${docs.length - toInsert.length} déjà présente(s), ignorée(s))`);
  }

  await srcConn.close();
  await destConn.close();
  console.log("🎉 Migration terminée.");
}

migrate().catch(err => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
