const { loadDashboard, json } = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });
  try {
    return json(res, 200, await loadDashboard());
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
};
