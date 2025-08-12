// GET /activities?search=&limit=20
const { Activity, Sequelize } = require('../models');
const { Op } = Sequelize;

exports.listActivities = async (req, res) => {
  try {
    const { search = '', limit = 50 } = req.query;
    const rows = await Activity.findAll({
      where: search
        ? { name: { [Op.iLike]: `%${search}%` } }
        : undefined,
      attributes: [['id','value'], ['name','label']], // prêt pour un select {value,label}
      order: [['name','ASC']],
      limit: Number(limit),
    });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Erreur activités', error: e.message });
  }
};
