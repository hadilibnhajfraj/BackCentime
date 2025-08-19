// src/controllers/lookups.controller.js
const { Op } = require('sequelize');
const db = require('../models');

exports.searchActivities = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const where = q
      ? { name: { [Op.iLike]: `%${q}%` } } // Postgres: iLike pour insensible à la casse
      : undefined;

    const rows = await db.Activity.findAll({
      where,
      attributes: ['id', ['name', 'label']],
      order: [['name', 'ASC']],
      limit: 30,
    });

    // format { value, label }
    const data = rows.map((r) => ({ value: r.id, label: r.get('label') }));
    res.json(data);
  } catch (e) {
    console.error('searchActivities:', e);
    res.status(500).json({ error: 'Erreur recherche activités' });
  }
};

exports.listDepartments = async (req, res) => {
  try {
    const code = (req.query.code || '').trim();
    const where = code ? { code: { [Op.iLike]: `${code}%` } } : undefined;

    const rows = await db.Department.findAll({
      where,
      attributes: ['id', 'code', 'name'],
      order: [['code', 'ASC']],
      limit: 100,
    });

    // label = CODE - Name
    const data = rows.map((r) => ({
      value: r.id,
      label: r.code ? `${r.code} - ${r.name ?? ''}`.trim() : r.name ?? '',
    }));
    res.json(data);
  } catch (e) {
    console.error('listDepartments:', e);
    res.status(500).json({ error: 'Erreur liste départements' });
  }
};

exports.usersByGroup = async (req, res) => {
  try {
    const {
      group = 'client',    // ex: 'agent', 'client', 'admin'
      groupId,             // ex: 12
      q,                   // filtre texte optionnel
      limit = 200
    } = req.query;

    // ---- Construire le filtre du groupe
    let whereGroup;
    if (groupId) {
      whereGroup = { id: Number(groupId) };
    } else if (group) {
      // match insensible à la casse (+ wildcards)
      whereGroup = { name: { [Op.iLike]: `%${group}%` } };
    } else {
      whereGroup = { name: { [Op.iLike]: '%client%' } };
    }

    // ---- Logs utiles (compte des relations)
    if (groupId) {
      const countRel = await db.res_users_res_groups_rel.count({
        where: { gid: Number(groupId) },
      });
      console.log(`[usersByGroup] gid=${groupId} → relations=${countRel}`);
    } else {
      const foundGroups = await db.res_groups.findAll({
        where: whereGroup,
        attributes: ['id', 'name'],
      });
      const ids = foundGroups.map(g => g.id);
      if (ids.length) {
        const countRel = await db.res_users_res_groups_rel.count({
          where: { gid: { [Op.in]: ids } },
        });
        console.log(
          `[usersByGroup] groups=[${foundGroups.map(g => g.name).join(', ')}] → relations=${countRel}`
        );
      } else {
        console.log(`[usersByGroup] aucun groupe correspondant à "${group}"`);
      }
    }

    // ---- Requête principale
    const users = await db.res_users.findAll({
      attributes: ['id', 'login', 'active', 'partner_id'],
      ...(q && {
        where: {
          [Op.or]: [
            { login: { [Op.iLike]: `%${q}%` } },
          ],
        },
      }),
      include: [
        {
          model: db.res_groups,
          as: 'groups',
          attributes: [],
          through: { attributes: [] },
          where: whereGroup,
          required: true, // ← ne renvoie que les users appartenant au(x) groupe(s) ciblé(s)
        },
        {
          model: db.res_partner,
          as: 'partner',
          attributes: ['id', 'name', 'email', 'street', 'city', 'country_id'],
        },
      ],
      order: [[{ model: db.res_partner, as: 'partner' }, 'name', 'ASC']],
      limit: Number(limit) || 200,
    });

    console.log('[usersByGroup] users.length =', users.length);

    const data = users.map(u => ({
      id: u.id,
      value: u.id,
      label: u.partner?.name || u.login || `user_${u.id}`,
      email: u.partner?.email || null,
      partner_id: u.partner_id,
      partner_name: u.partner?.name || null,
      address: [u.partner?.street, u.partner?.city].filter(Boolean).join(', ') || null,
      active: u.active,
    }));

    res.json(data);
  } catch (e) {
    console.error('usersByGroup error:', e);
    res.status(500).json({ error: "Erreur récupération utilisateurs par groupe" });
  }
};
