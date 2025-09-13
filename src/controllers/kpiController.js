const { getDashboard } = require('../services/kpiService');

async function dashboard(req, res) {
  try {
    return res.json(getDashboard());
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Erreur interne' });
  }
}

module.exports = { dashboard };
