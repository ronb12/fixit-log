const { neon } = require("@neondatabase/serverless");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = neon(databaseUrl);
let ready;

async function ensureSchema() {
  if (ready) return ready;
  ready = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS assets (
        id text PRIMARY KEY,
        name text NOT NULL,
        category text NOT NULL,
        purchase_year integer,
        priority text NOT NULL DEFAULT 'Routine',
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS maintenance_records (
        id text PRIMARY KEY,
        asset_id text NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        task text NOT NULL,
        due_date date,
        cost numeric(10,2) NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'Logged',
        vendor text NOT NULL DEFAULT '',
        notes text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
  })();
  return ready;
}

async function seedIfEmpty() {
  await ensureSchema();
  const rows = await sql`SELECT COUNT(*)::int AS count FROM assets`;
  if (rows[0].count > 0) return;
  const homeId = crypto.randomUUID();
  const carId = crypto.randomUUID();
  await sql`
    INSERT INTO assets (id, name, category, purchase_year, priority)
    VALUES
      (${homeId}, ${"Main House HVAC"}, ${"Home"}, ${2019}, ${"High"}),
      (${carId}, ${"Honda Accord"}, ${"Vehicle"}, ${2018}, ${"Routine"})
  `;
  await sql`
    INSERT INTO maintenance_records (id, asset_id, task, due_date, cost, status, vendor, notes)
    VALUES
      (${crypto.randomUUID()}, ${homeId}, ${"Replace MERV filter"}, ${"2026-06-04"}, ${18}, ${"Due Soon"}, ${"Home Depot"}, ${"Quarterly replacement"}),
      (${crypto.randomUUID()}, ${carId}, ${"Oil change + tire rotation"}, ${"2026-06-12"}, ${84.20}, ${"Logged"}, ${"Quick Lube Center"}, ${"Track next mileage interval"})
  `;
}

async function loadDashboard() {
  await seedIfEmpty();
  const assets = await sql`
    SELECT id, name, category, purchase_year, priority, created_at
    FROM assets
    ORDER BY category ASC, name ASC
  `;
  const assetIds = assets.map((asset) => asset.id);
  const records = assetIds.length
    ? await sql`
        SELECT id, asset_id, task, due_date, cost, status, vendor, notes, created_at
        FROM maintenance_records
        WHERE asset_id = ANY(${assetIds})
        ORDER BY due_date ASC NULLS LAST, created_at DESC
      `
    : [];

  const totalCost = records.reduce((sum, item) => sum + Number(item.cost || 0), 0);
  const dueSoon = records.filter((item) => item.status !== "Done").length;
  const urgent = records.filter((item) => item.status === "Due Soon").length;

  return {
    assets,
    records,
    stats: {
      totalAssets: assets.length,
      totalCost,
      dueSoon,
      urgent
    }
  };
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

module.exports = { sql, ensureSchema, loadDashboard, json };
