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
      if (!body.name || !body.category) return json(res, 400, { error: "Missing required asset fields" });
      await sql`
        INSERT INTO assets (id, name, category, purchase_year, priority)
        VALUES (
          ${crypto.randomUUID()},
          ${String(body.name)},
          ${String(body.category)},
          ${body.purchaseYear ? Number(body.purchaseYear) : null},
          ${String(body.priority || "Routine")}
        )
      `;
      return json(res, 201, await loadDashboard());
    }
    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
};
