// src/controllers/Prestation.controller.js
const { Op, QueryTypes } = require('sequelize');
const util = require('util');
const db = require('../models');

const Prestation = db.Prestation;

/* --------------------------------- Utils --------------------------------- */

const intOrNull = (v) =>
  v != null && /^\d+$/.test(String(v)) ? Number(v) : null;

async function resolveActivityTemplateId({ db, activityId, activite }) {
  // 1) id direct
  let candidate = intOrNull(activityId);
  if (candidate && db.product_template) {
    const ok = await db.product_template
      .findByPk(candidate, { attributes: ['id'] })
      .catch(() => null);
    if (ok) return candidate;
  }
  // 2) par nom
  if (activite && db.product_template) {
    const tpl = await db.product_template
      .findOne({
        where: { name: { [db.Sequelize.Op.iLike]: String(activite).trim() } },
        attributes: ['id'],
      })
      .catch(() => null);
    if (tpl?.id) return tpl.id;
  }
  // 3) par code article (product_product.default_code)
  if (activite && db.sequelize) {
    const sql = `
      SELECT pt.id
      FROM product_product pp
      JOIN product_template pt ON pt.id = pp.product_tmpl_id
      WHERE pp.default_code ILIKE :code
      LIMIT 1
    `;
    const rows = await db.sequelize
      .query(sql, {
        replacements: { code: String(activite).trim() },
        type: db.Sequelize.QueryTypes.SELECT,
      })
      .catch(() => []);
    if (rows?.[0]?.id) return rows[0].id;
  }
  // 4) fallback .env
  const envAct = intOrNull(process.env.DEFAULT_ACTIVITY_ID);
  if (envAct) return envAct;
  return null;
}

async function resolveAnalyticId(db, rawVal) {
  const toInt = (v) =>
    v != null && /^\d+$/.test(String(v)) ? Number(v) : null;

  async function exists(id) {
    if (!id) return false;
    try {
      const rows = await db.sequelize.query(
        'SELECT id FROM account_analytic_account WHERE id = :id LIMIT 1',
        { replacements: { id }, type: db.Sequelize.QueryTypes.SELECT },
      );
      return !!rows?.[0]?.id;
    } catch {
      return false;
    }
  }

  // a) body
  let candidate = toInt(rawVal);
  if (await exists(candidate)) return candidate;

  // b) env
  const envVal = toInt(process.env.DEFAULT_ANALYTIC_ACCOUNT_ID);
  if (await exists(envVal)) return envVal;

  // c) pick first
  try {
    const rows = await db.sequelize.query(
      'SELECT id FROM account_analytic_account ORDER BY id LIMIT 1',
      { type: db.Sequelize.QueryTypes.SELECT },
    );
    if (rows?.[0]?.id) return rows[0].id;
  } catch {}

  return null;
}

async function resolveOfficeOrderId(db, rawVal) {
  const candidate = intOrNull(rawVal);

  async function exists(id) {
    if (!id) return false;
    try {
      const rows = await db.sequelize.query(
        'SELECT id FROM office_order WHERE id = :id LIMIT 1',
        { replacements: { id }, type: db.Sequelize.QueryTypes.SELECT },
      );
      return !!rows?.[0]?.id;
    } catch {
      return false;
    }
  }

  if (await exists(candidate)) return candidate;

  const envVal = intOrNull(process.env.DEFAULT_OFFICE_ORDER_ID);
  if (await exists(envVal)) return envVal;

  return null; // OK si la colonne n’est pas NOT NULL en DB
}

// normalisation simple pour la liste générique
function normalizePrest(p) {
  const plain = p.get ? p.get({ plain: true }) : p;
  return {
    id: plain.id,
    prestation: plain.prestation ?? null,
    description: plain.name_primary ?? plain.description ?? null,
    department_name: plain?.department?.name ?? plain.department_name ?? null,
    partner_name: plain?.client?.name ?? plain.partner_name ?? null,
    iat: plain.iat ?? null,
    responsible_name: plain.responsible_name ?? null,
    chef_projet: plain.responsible_name ?? plain.chef_projet ?? null,
    intervenants: plain.intervenants ?? plain.intervenats ?? null,
    date: plain.date ?? null,
    date_start_prevue: plain.date_start_prevue ?? null,
    activity_name: plain?.activity?.name ?? plain.activity_name ?? null,
    commercial: plain.commercial ?? null,
    state: plain.state || 'Demande',
    documents: plain.documents || [],
    department: plain.department || null,
    activity: plain.activity || null,
  };
}

/* ------------------------------ Create (POST) ----------------------------- */

exports.createPrestation = async (req, res) => {
  try {
    console.log(
      '[Prestation] body reçu =',
      util.inspect(req.body, { depth: null, colors: false }),
    );

    let {
      activityId: _activityId,
      departmentId: _departmentId,
      clientId: _clientId,
      activite,
      departement,
      client,

      nom_projet,
      date,
      entete_texte,
      reference_bordereau,
      bureau_order,
      t,
      iat,
      pays,
      actif,
      numPrestation,
      chefProjet,
      intervenants,
      dateCreation,
      type,
      adresse_client,

      analyticAccountId: _analyticAccountId,
    } = req.body;

    if (!nom_projet) {
      return res
        .status(400)
        .json({ message: "Le champ 'nom_projet' est requis." });
    }

    let activityId = _activityId ?? null;
    let departmentId = _departmentId ?? null;
    let partnerId = _clientId ?? null;

    // Dept par libellé si besoin
    if (!departmentId && departement && db.Department) {
      const dep = await db.Department.findOne({
        where: {
          [Op.or]: [
            { code: { [Op.iLike]: departement } },
            { name: { [Op.iLike]: departement } },
          ],
        },
        attributes: ['id'],
      });
      departmentId = dep?.id ?? null;
    }

    // Client par libellé si un jour tu relies res_partner
    if (!partnerId && client && db.res_partner) {
      const partner = await db.res_partner.findOne({
        where: { name: { [Op.iLike]: client } },
        attributes: ['id'],
      });
      partnerId = partner?.id ?? null;
    }

    // country
    const toIntOrNull = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);
    let countryId = null;
    if (pays != null && pays !== '') {
      countryId = toIntOrNull(pays);
      if (countryId == null) {
        const p = String(pays).trim().toLowerCase();
        const COUNTRY_MAP = {
          tunisie: 223,
          tunisia: 223,
          france: 73,
          maroc: 150,
          morocco: 150,
          algérie: 4,
          algerie: 4,
          algeria: 4,
        };
        countryId = COUNTRY_MAP[p] ?? null;
      }
      if (countryId == null && db.res_country) {
        const co = await db.res_country.findOne({
          where: { name: { [Op.iLike]: pays } },
          attributes: ['id'],
        });
        countryId = co?.id ?? null;
      }
    }
    if (countryId == null) {
      const envCountry = Number(process.env.DEFAULT_COUNTRY_ID);
      countryId =
        !Number.isNaN(envCountry) && envCountry > 0 ? envCountry : 223;
    }

    const officeOrderId = await resolveOfficeOrderId(db, bureau_order);
    const analyticAccountId = await resolveAnalyticId(db, _analyticAccountId);

    if (analyticAccountId == null) {
      return res.status(400).json({
        message:
          'Aucun compte analytique valide. Définissez DEFAULT_ANALYTIC_ACCOUNT_ID dans le .env ' +
          'ou créez au moins un account_analytic_account.',
      });
    }

    const PRIVACY_DEFAULT = 'employees';
    const resolvedActivityId = await resolveActivityTemplateId({
      db,
      activityId,
      activite,
    });
    if (!resolvedActivityId) {
      return res.status(400).json({
        message:
          "Activité invalide: l'id/libellé ne correspond à aucun 'product_template'.",
        details: { activityIdRecu: activityId, activiteRecue: activite },
      });
    }

    // Valider departmentId si modèle hr_department présent
    let resolvedDeptId = departmentId;
    if (resolvedDeptId != null && db.hr_department) {
      const depExists = await db.hr_department.findByPk(resolvedDeptId, {
        attributes: ['id'],
      });
      if (!depExists) resolvedDeptId = null;
    }
    if (resolvedDeptId == null && departement && db.hr_department) {
      const dep = await db.hr_department.findOne({
        where: {
          [Op.or]: [
            { code: { [Op.iLike]: departement } },
            { name: { [Op.iLike]: departement } },
          ],
        },
        attributes: ['id'],
      });
      resolvedDeptId = dep?.id ?? null;
    }

    const insertData = {
      aliasModel: 'project.task',
      activityId: resolvedActivityId,
      departmentId: resolvedDeptId,

      accountAnalyticId: analyticAccountId,
      countryId,
      privacyVisibility: PRIVACY_DEFAULT,
      t: !!t,
      active: typeof actif === 'boolean' ? actif : true,

      namePrimary: nom_projet,
      date,
      entete: entete_texte || '',
      referenceBordereau: reference_bordereau || null,
      officeOrderId,
      iat: iat ?? null,
      prestation: numPrestation ?? null,
      responsibleId: chefProjet ?? null,
      intervenats: intervenants ?? null,
      dateCreation: dateCreation ?? null,
      desctiption: adresse_client ? `Adresse client: ${adresse_client}` : null,
    };

    console.log(
      '[Prestation] INSERT →',
      util.inspect(insertData, { depth: null, colors: false }),
    );
    const newPrest = await Prestation.create(insertData);
    return res.status(201).json(newPrest);
  } catch (error) {
    console.error('Erreur création prestation :', {
      name: error?.name,
      code: error?.parent?.code,
      detail: error?.parent?.detail,
      constraint: error?.parent?.constraint,
      sql: error?.sql,
      parameters: error?.parameters,
      message: String(error),
    });
    return res
      .status(500)
      .json({ message: 'Erreur lors de la création', error: String(error) });
  }
};

/* ------------------------- Résumé pour les compteurs ---------------------- */
/** GET /dossier/prestations/summary -> { counts:[{state,count}], total } */
exports.summary = async (req, res) => {
  try {
    const rows = await Prestation.findAll({
      attributes: [
        'state',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
      ],
      group: ['state'],
      raw: true,
    });
    const counts = rows.map((r) => ({
      state: String(r.state || '').toLowerCase(),
      count: Number(r.count || 0),
    }));
    const total = counts.reduce((s, r) => s + r.count, 0);
    res.json({ counts, total });
  } catch (e) {
    console.error('summary error', e);
    res.status(500).json({ message: 'Erreur summary', error: String(e) });
  }
};

/* ----------------------- Liste paginée filtrée par état ------------------- */
/** GET /dossier/prestations?state=closed&page=1&pageSize=10&q=... */
// Prestation.controller.js

// états techniques réellement présents en DB
const ALLOWED_STATES = new Set(['closed', 'done', 'open', 'draft', 'rejected']);

exports.listByState = async (req, res) => {
  try {
    const state = String(req.query.state || '').toLowerCase();

    if (!state) {
      return res
        .status(400)
        .json({ message: "Paramètre 'state' manquant. Ex: ?state=closed" });
    }
    if (!ALLOWED_STATES.has(state)) {
      return res.status(400).json({
        message: "Paramètre 'state' invalide.",
        allowed: Array.from(ALLOWED_STATES),
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(req.query.pageSize, 10) || 10),
    );
    const q = String(req.query.q || '').trim();
    const offset = (page - 1) * pageSize;

    let where = `pp.state = :state`;
    const repl = { state, limit: pageSize, offset };
    if (q) {
      where += ` AND (pp.prestation ILIKE :q OR pp.name_primary ILIKE :q)`;
      repl.q = `%${q}%`;
    }

    const rowsSql = `
      SELECT
        pp.id, pp.prestation, pp.name_primary, pp.date, pp.iat,
        pp.reference_bordereau, pp.department_id, pp.activity_id,
        d.name  AS department_name,
        pt.name AS activity_name
      FROM prestation_prestation pp
      LEFT JOIN hr_department   d  ON d.id  = pp.department_id
      LEFT JOIN product_template pt ON pt.id = pp.activity_id
      WHERE ${where}
      ORDER BY pp.id DESC
      LIMIT :limit OFFSET :offset
    `;
    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM prestation_prestation pp
      WHERE ${where}
    `;

    const rows = await db.sequelize.query(rowsSql, {
      replacements: repl,
      type: QueryTypes.SELECT,
    });
    const count = await db.sequelize
      .query(countSql, { replacements: repl, type: QueryTypes.SELECT })
      .then((r) => r?.[0]?.count ?? 0);

    res.json({ rows, count, page, pageSize });
  } catch (e) {
    console.error('listByState error:', e);
    res.status(500).json({ message: 'Erreur listByState', error: String(e) });
  }
};

/* ---------------------------- Liste générique ----------------------------- */
/** GET /prestations?q=...&state=...&limit=...&offset=...&order=id:DESC */
exports.listPrestations = async (req, res) => {
  try {
    const { q, state, limit = 1000, offset = 0, order = 'id:DESC' } = req.query;

    const where = {};
    if (state) where.state = state;
    if (q && String(q).trim()) {
      const s = `%${String(q).trim()}%`;
      where[Op.or] = [
        { prestation: { [Op.iLike]: s } },
        { name_primary: { [Op.iLike]: s } },
        { desctiption: { [Op.iLike]: s } },
        { iat: { [Op.iLike]: s } },
      ];
    }

    let orderArr = [['id', 'DESC']];
    if (order) {
      const [col, dir] = String(order).split(':');
      if (col) orderArr = [[col, (dir || 'DESC').toUpperCase()]];
    }

    const rows = await Prestation.findAll({
      where,
      include: [
        { model: db.Department, as: 'department', attributes: ['id', 'name'] },
        { model: db.Activity, as: 'activity', attributes: ['id', 'name'] },
        {
          model: db.Document,
          as: 'documents',
          attributes: ['id', 'type', 'cheminFichier', 'actif', 'date'],
        },
      ],
      order: orderArr,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json(rows.map(normalizePrest));
  } catch (err) {
    console.error('listPrestations error:', err);
    res
      .status(500)
      .json({ message: 'Erreur lors de la récupération des prestations.' });
  }
};

/* --------------------------- CRUD + par client ---------------------------- */

exports.getPrestationById = async (req, res) => {
  try {
    const prest = await Prestation.findByPk(req.params.id, {
      include: [
        {
          model: db.Document,
          as: 'documents',
          attributes: ['id', 'type', 'cheminFichier', 'actif', 'date'],
        },
        { model: db.Department, as: 'department', attributes: ['id', 'name'] },
        { model: db.Activity, as: 'activity', attributes: ['id', 'name'] },
      ],
    });
    if (!prest)
      return res.status(404).json({ message: 'Prestation non trouvée' });
    res.json(normalizePrest(prest));
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération Prestation', error });
  }
};

exports.updatePrestation = async (req, res) => {
  try {
    const prest = await Prestation.findByPk(req.params.id);
    if (!prest)
      return res.status(404).json({ message: 'Prestation non trouvée' });

    await prest.update(req.body);
    res.json(prest);
  } catch (error) {
    res.status(500).json({ message: 'Erreur mise à jour Prestation', error });
  }
};

exports.deletePrestation = async (req, res) => {
  try {
    const prest = await Prestation.findByPk(req.params.id);
    if (!prest)
      return res.status(404).json({ message: 'Prestation non trouvée' });

    await prest.destroy();
    res.json({ message: 'Prestation supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur suppression Prestation', error });
  }
};

exports.getPrestationsByClient = async (req, res) => {
  try {
    const role = req.user?.role?.toUpperCase();
    const clientId = String(req.user?.id || '');

    if (role !== 'CLIENT') {
      return res.status(403).json({ message: 'Accès réservé aux clients' });
    }

    const rows = await Prestation.findAll({ where: { client: clientId } });
    res.status(200).json(rows.map(normalizePrest));
  } catch (err) {
    console.error('getPrestationsByClient error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
// controllers/Prestation.controller.js
exports.getPrestationFull = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "id invalide" });

    const sql = `
      SELECT
        pp.*,
        d.name  AS department_name,
        pt.name AS activity_name,
        co.name AS country_name,
        aaa.name AS analytic_name,
        aaa.code AS analytic_code,
        ru_partner.name AS responsible_name,        -- si vous mappez users -> res_partner
        ru1_partner.name AS responsible1_name
      FROM prestation_prestation pp
      LEFT JOIN hr_department            d   ON d.id  = pp.department_id
      LEFT JOIN product_template         pt  ON pt.id = pp.activity_id
      LEFT JOIN res_country              co  ON co.id = pp.country_id
      LEFT JOIN account_analytic_account aaa ON aaa.id = pp.analytic_account_id
      LEFT JOIN res_users                ru  ON ru.id = pp.responsible_id
      LEFT JOIN res_partner              ru_partner  ON ru_partner.id  = ru.partner_id
      LEFT JOIN res_users                ru1 ON ru1.id = pp.responsible1_id
      LEFT JOIN res_partner              ru1_partner ON ru1_partner.id = ru1.partner_id
      WHERE pp.id = :id
      LIMIT 1
    `;
    const rows = await db.sequelize.query(sql, {
      replacements: { id },
      type: db.Sequelize.QueryTypes.SELECT,
    });
    const row = rows?.[0];
    if (!row) return res.status(404).json({ message: 'Prestation non trouvée' });

    let documents = [];
    if (db.Document) {
      documents = await db.Document.findAll({
        where: { prestation_id: id },
        attributes: ['id', 'type', 'cheminFichier', 'actif', 'date'],
        order: [['id', 'DESC']],
      });
    }
    res.json({ row, documents });
  } catch (e) {
    console.error('getPrestationFull error', e);
    res.status(500).json({ message: 'Erreur serveur', error: String(e) });
  }
};

