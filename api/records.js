const { sql, ensureSchema, loadDashboard, json } = require("./_db");

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

module.exports = async function handler(req, res) {
  try {
    await ensureSchema();
    if (req.method === "POST") {
      const body = await readBody(req);
      if (!body.assetId || !body.task) return json(res, 400, { error: "Missing required maintenance fields" });
      await sql`
        INSERT INTO maintenance_records (id, asset_id, task, due_date, cost, status, vendor, notes)
        VALUES (
          ${crypto.randomUUID()},
          ${String(body.assetId)},
          ${String(body.task)},
          ${body.dueDate ? String(body.dueDate) : null},
          ${Number(body.cost || 0)},
          ${String(body.status || "Logged")},
          ${String(body.vendor || "")},
          ${String(body.notes || "")}
        )
      `;
      return json(res, 201, await loadDashboard());
    }
    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
};
