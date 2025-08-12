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
    const { group = 'client', groupId } = req.query;

    const whereGroup = groupId
      ? { id: Number(groupId) }
      : { name: { [Op.iLike]: `%${group}%` } };

    // 🔎 === Ajoute CE BLOC ICI (juste avant le findAll) ===
    const gid = Number(groupId || 9999); // 999 = "Groupe pour les clients" (d’après ta capture)
    const countRel = await db.res_users_res_groups_rel.count({
      where: { gid },
    });
    console.log('Relations pour gid=', gid, ' => ', countRel);
    // ======================================================

    const users = await db.res_users.findAll({
      attributes: ['id', 'login', 'active', 'partner_id'],
      include: [
        {
          model: db.res_groups,
          as: 'groups',
          attributes: [],
          through: { attributes: [] },
          where: whereGroup,
        },
        {
          model: db.res_partner,
          as: 'partner',
          attributes: ['id', 'name', 'email', 'street', 'city', 'country_id'],
        },
      ],
      order: [[{ model: db.res_partner, as: 'partner' }, 'name', 'ASC']],
      limit: 200,
    });

    // (optionnel) autre log utile
    console.log('usersByGroup -> users.length =', users.length);

    const data = users.map((u) => ({
      id: u.id,
      value: u.id,
      label: u.partner?.name || u.login || `user_${u.id}`,
      email: u.partner?.email || null,
      partner_id: u.partner_id,
      partner_name: u.partner?.name || null,
      address:
        [u.partner?.street, u.partner?.city].filter(Boolean).join(', ') || null,
      active: u.active,
    }));

    res.json(data);
  } catch (e) {
    console.error('usersByGroup:', e);
    res
      .status(500)
      .json({ error: 'Erreur récupération utilisateurs (clients) par groupe' });
  }
};
