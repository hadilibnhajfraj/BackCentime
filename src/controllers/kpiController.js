const { QueryTypes } = require('sequelize');
const { getDashboard } = require('../services/kpiService');
const db = require('../models');

const sequelize = db.sequelize;

/** GET /api/kpi/dashboard */
async function dashboard(req, res) {
  try {
    // si getDashboard() est synchrone, "await" est inoffensif
    const payload = await getDashboard();
    return res.json(payload);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Erreur interne' });
  }
}

/** GET /api/kpi/prestations-by-activity */
async function prestationsByActivity(req, res) {
  try {
    const { from = null, to = null, state = null } = req.query;

    const sql = `
      WITH filtres AS (
        SELECT CAST(:from AS timestamptz) AS dfrom,
               CAST(:to   AS timestamptz) AS dto,
               NULLIF(:state, '')::text   AS fstate
      ),
      base AS (
        SELECT p.*
        FROM public.prestation_prestation p, filtres f
        WHERE (:from  IS NULL OR p.create_date >= f.dfrom)
          AND (:to    IS NULL OR p.create_date  < f.dto)
          AND (:state IS NULL OR p.state = f.fstate)
      ),
      agg AS (
        SELECT
          a.id   AS activity_id,
          a.name AS activity_name,
          COUNT(b.id)                                             AS prestations,
          COUNT(DISTINCT b.product_product_id)                    AS nb_products,
          SUM((b.state = 'done')::int)                            AS done,
          SUM((b.state = 'cancel')::int)                          AS cancel,
          SUM((b.state IS NULL OR b.state NOT IN ('done','cancel'))::int) AS in_progress,
          COALESCE(SUM(b.amount_dop), 0)                          AS total_amount
        FROM base b
        LEFT JOIN public.activity_activity a ON a.id = b.activity_id
        GROUP BY a.id, a.name
      )
      SELECT
        activity_id,
        COALESCE(activity_name, 'Sans activité') AS activity_name,
        prestations,
        nb_products,
        done,
        cancel,
        in_progress,
        total_amount,
        ROUND(100.0 * prestations / NULLIF(SUM(prestations) OVER (), 0), 2) AS pct_of_total
      FROM agg
      ORDER BY prestations DESC NULLS LAST;
    `;

    const rows = await sequelize.query(sql, {
      type: QueryTypes.SELECT,              // <-- propre
      replacements: { from, to, state },
    });

    return res.json({ rows, params: { from, to, state } });
  } catch (err) {
    console.error('KPI prestations-by-activity error:', err);
    return res.status(500).json({ message: 'Erreur KPI', error: err.message });
  }
}
/** GET /api/kpi/prestations-by-state?from=YYYY-MM-DD&to=YYYY-MM-DD */
async function prestationsByState(req, res) {
  try {
    const { from = null, to = null } = req.query;

    const sql = `
      WITH filtres AS (
        SELECT CAST(:from AS timestamptz) AS dfrom,
               CAST(:to   AS timestamptz) AS dto
      ),
      base AS (
        SELECT p.*
        FROM public.prestation_prestation p, filtres f
        WHERE (:from IS NULL OR p.create_date >= f.dfrom)
          AND (:to   IS NULL OR p.create_date  < f.dto)
      ),
      agg AS (
        SELECT
          COALESCE(NULLIF(TRIM(state), ''), 'unknown') AS state,
          COUNT(*) AS n
        FROM base
        GROUP BY 1
      )
      SELECT
        state,
        n AS count,
        ROUND(100.0 * n / NULLIF(SUM(n) OVER(), 0), 2) AS pct
      FROM agg
      ORDER BY count DESC, state ASC;
    `;

    const rows = await sequelize.query(sql, {
      type: QueryTypes.SELECT,
      replacements: { from, to }
    });

    res.json({
      rows,
      total: rows.reduce((s, r) => s + Number(r.count || 0), 0),
      params: { from, to }
    });
  } catch (err) {
    console.error("KPI prestations-by-state error:", err);
    res.status(500).json({ message: "Erreur KPI", error: err.message });
  }
}
module.exports = {
  dashboard,
  prestationsByState,
  prestationsByActivity,  // <-- maintenant exporté
};
