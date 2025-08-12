// src/controllers/Prestation.controller.js
const { Op, QueryTypes } = require('sequelize');
const util = require('util');
const db = require('../models');
const Prestation = db.Prestation;

// ===== helpers communs =====
const intOrNull = (v) =>
  v != null && /^\d+$/.test(String(v)) ? Number(v) : null;

// Résout l'activité vers un product_template.id
async function resolveActivityTemplateId({ db, activityId, activite }) {
  // 1) id direct → product_template.id (si modèle dispo)
  let candidate = intOrNull(activityId);
  if (candidate && db.product_template) {
    const exists = await db.product_template
      .findByPk(candidate, { attributes: ['id'] })
      .catch(() => null);
    if (exists) return candidate;
  }

  // 2) name sur product_template (si modèle dispo)
  if (activite && db.product_template) {
    const tpl = await db.product_template
      .findOne({
        where: { name: { [db.Sequelize.Op.iLike]: String(activite).trim() } },
        attributes: ['id'],
      })
      .catch(() => null);
    if (tpl?.id) return tpl.id;
  }

  // 3) SQL brute: default_code (product_product) -> product_template.id
  if (activite && db.sequelize) {
    const q = `
      SELECT pt.id
      FROM product_product pp
      JOIN product_template pt ON pt.id = pp.product_tmpl_id
      WHERE pp.default_code ILIKE :code
      LIMIT 1
    `;
    const rows = await db.sequelize
      .query(q, {
        replacements: { code: String(activite).trim() },
        type: db.Sequelize.QueryTypes.SELECT,
      })
      .catch(() => []);
    if (rows?.[0]?.id) return rows[0].id;
  }

  // 4) fallback .env
  const envAct = intOrNull(process.env.DEFAULT_ACTIVITY_ID);
  if (envAct) {
    if (db.product_template) {
      const ok = await db.product_template
        .findByPk(envAct, { attributes: ['id'] })
        .catch(() => null);
      if (ok) return envAct;
    } else {
      return envAct; // pas de modèle => on fait confiance à l'env
    }
  }
  return null;
}

// Résout un id analytique existant (body -> env -> 1er existant) ou null
async function resolveAnalyticId(db, rawVal) {
  const toInt = (v) =>
    v != null && /^\d+$/.test(String(v)) ? Number(v) : null;

  async function existsInDB(id) {
    if (!id) return false;
    try {
      const rows = await db.sequelize.query(
        'SELECT id FROM account_analytic_account WHERE id = :id LIMIT 1',
        { replacements: { id }, type: db.Sequelize.QueryTypes.SELECT },
      );
      return !!(rows && rows[0]?.id);
    } catch {
      return false;
    }
  }

  // a) body
  let candidate = toInt(rawVal);
  if (await existsInDB(candidate)) return candidate;

  // b) .env
  const envVal = toInt(process.env.DEFAULT_ANALYTIC_ACCOUNT_ID);
  if (await existsInDB(envVal)) return envVal;

  // c) auto-pick: prendre un id existant
  try {
    const rows = await db.sequelize.query(
      'SELECT id FROM account_analytic_account ORDER BY id LIMIT 1',
      { type: db.Sequelize.QueryTypes.SELECT },
    );
    if (rows?.[0]?.id) return rows[0].id;
  } catch {}

  // d) rien trouvé
  return null;
}

// Vérifie office_order_id ; sinon env ; sinon null
async function resolveOfficeOrderId(db, rawVal) {
  const candidate = intOrNull(rawVal);

  async function existsInDB(id) {
    if (!id) return false;
    try {
      const rows = await db.sequelize.query(
        'SELECT id FROM office_order WHERE id = :id LIMIT 1',
        { replacements: { id }, type: db.Sequelize.QueryTypes.SELECT },
      );
      return !!(rows && rows[0]?.id);
    } catch {
      return false;
    }
  }

  // a) valeur envoyée
  if (await existsInDB(candidate)) return candidate;

  // b) fallback .env
  const envVal = intOrNull(process.env.DEFAULT_OFFICE_ORDER_ID);
  if (await existsInDB(envVal)) return envVal;

  // c) auto-pick (facultatif) — décommente pour choisir le plus petit id existant
  // try {
  //   const rows = await db.sequelize.query(
  //     'SELECT id FROM office_order ORDER BY id LIMIT 1',
  //     { type: db.Sequelize.QueryTypes.SELECT }
  //   );
  //   if (rows?.[0]?.id) return rows[0].id;
  // } catch {}

  // d) rien trouvé
  return null;
}

exports.createPrestation = async (req, res) => {
  try {
    console.log(
      '[Prestation] body reçu =',
      util.inspect(req.body, { depth: null, colors: false }),
    );

    let {
      // IDs directs
      activityId: _activityId,
      departmentId: _departmentId,
      clientId: _clientId,

      // Libellés fallback
      activite,
      departement,
      client,

      // Champs écran
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

      // optionnel
      analyticAccountId: _analyticAccountId,
    } = req.body;

    if (!nom_projet) {
      return res
        .status(400)
        .json({ message: "Le champ 'nom_projet' est requis." });
    }

    // ---------- IDs init ----------
    let activityId = _activityId ?? null;
    let departmentId = _departmentId ?? null;
    let partnerId = _clientId ?? null;
    console.log('[Prestation] IDs init →', {
      _activityId,
      _departmentId,
      _clientId,
      activite,
      departement,
      client,
    });

    // Dept par libellé si besoin
    if (!departmentId && departement) {
      const dep = await db.Department?.findOne({
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

    // Client par libellé (si un jour partnerId est relié)
    if (!partnerId && client) {
      const partner = await db.res_partner?.findOne({
        where: { name: { [Op.iLike]: client } },
        attributes: ['id'],
      });
      partnerId = partner?.id ?? null;
    }

    // ---------- countryId robuste ----------
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

    // ---------- office_order_id : vérifier l'existence ----------
    const officeOrderId = await resolveOfficeOrderId(db, bureau_order);
    console.log('[Prestation] Résolution pays/compte/bureau →', {
      pays,
      countryId,
      bureau_order,
      officeOrderId,
    });

    // ---------- analytic_account_id (optionnel + vérif existence) ----------
    const analyticAccountId = await resolveAnalyticId(db, _analyticAccountId);
    console.log('[Prestation] Analytic résolu →', {
      body: _analyticAccountId,
      resolved: analyticAccountId,
    });

    // Si ta colonne analytic_account_id est NOT NULL en DB, active ce garde-fou :
    if (analyticAccountId == null) {
      return res.status(400).json({
        message:
          'Aucun compte analytique valide. Définissez DEFAULT_ANALYTIC_ACCOUNT_ID dans le .env ' +
          'ou créez au moins un account_analytic_account.',
      });
    }

    // ---------- activité -> product_template.id ----------
    const PRIVACY_DEFAULT = 'employees';
    const resolvedActivityId = await resolveActivityTemplateId({
      db,
      activityId,
      activite,
    });
    console.log('[Prestation] Résolution activité →', {
      activityId,
      activite,
      resolvedActivityId,
    });

    if (!resolvedActivityId) {
      return res.status(400).json({
        message:
          "Activité invalide: l'id/libellé ne correspond à aucun 'product_template'. " +
          'Envoyez un id de product_template valide, un code article existant (product_product.default_code) ' +
          'ou définissez DEFAULT_ACTIVITY_ID dans le .env.',
        details: { activityIdRecu: activityId, activiteRecue: activite },
      });
    }

    // (Optionnel) validation departmentId contre une table FK (ex: hr_department)
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

    // Si ta colonne office_order_id est NOT NULL chez toi, ajoute un garde :
    // if (officeOrderId == null) {
    //   return res.status(400).json({
    //     message: "Bureau d'ordre inexistant. Renseignez un 'office_order_id' valide ou configurez DEFAULT_OFFICE_ORDER_ID dans le .env."
    //   });
    // }

    // ---------- INSERT ----------
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
      officeOrderId, // OK si null (sauf si NOT NULL en DB)
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

    const newPrest = await db.Prestation.create(insertData);
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

exports.getAllPrestations = async (req, res) => {
  try {
    const Prestations = await Prestation.findAll();
    res.json(Prestations);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération Prestations', error });
  }
};

exports.getPrestationById = async (req, res) => {
  try {
    const Prestation = await Prestation.findByPk(req.params.id);
    if (!Prestation)
      return res.status(404).json({ message: 'Prestation non trouvé' });
    res.json(Prestation);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération Prestation', error });
  }
};

exports.updatePrestation = async (req, res) => {
  try {
    const Prestation = await Prestation.findByPk(req.params.id);
    if (!Prestation)
      return res.status(404).json({ message: 'Prestation non trouvé' });

    await Prestation.update(req.body);
    res.json(Prestation);
  } catch (error) {
    res.status(500).json({ message: 'Erreur mise à jour Prestation', error });
  }
};

exports.deletePrestation = async (req, res) => {
  try {
    const Prestation = await Prestation.findByPk(req.params.id);
    if (!Prestation)
      return res.status(404).json({ message: 'Prestation non trouvé' });

    await Prestation.destroy();
    res.json({ message: 'Prestation supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur suppression Prestation', error });
  }
};
exports.getPrestationsByClient = async (req, res) => {
  try {
    const role = req.user.role?.toUpperCase();
    const clientId = String(req.user.id);

    console.log('🔐 Utilisateur :', req.user);

    if (role !== 'CLIENT') {
      return res.status(403).json({ message: 'Accès réservé aux clients' });
    }

    const Prestations = await Prestation.findAll({
      where: { client: clientId },
    });

    res.status(200).json(Prestations);
  } catch (err) {
    console.error('❌ Erreur getPrestationsByClient:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
exports.getAllPrestations = async (req, res) => {
  try {
    const Prestations = await Prestation.findAll({
      include: [
        {
          model: db.Document,
          as: 'documents',
          attributes: ['id', 'type', 'cheminFichier', 'actif', 'date'],
        },
      ],
      order: [['id', 'DESC']],
    });

    res.status(200).json(Prestations);
  } catch (error) {
    console.error('Erreur lors de la récupération des Prestations :', error);
    res
      .status(500)
      .json({ error: 'Erreur lors de la récupération des Prestations' });
  }
};
