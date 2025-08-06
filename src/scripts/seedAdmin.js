const bcrypt = require('bcryptjs');
const {
  sequelize,
  res_users,
  res_groups,
  res_users_res_groups_rel,
  res_partner,
} = require('../models');
const { Op } = require('sequelize');
require('dotenv').config(); // ✅ Charger les variables d’environnement

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie.');

    const adminEmail = process.env.ADMIN_EMAIL;

    // 🔍 Vérifier si un partenaire avec id = 1 existe
    let partner = await res_partner.findByPk(1);
    if (!partner) {
      partner = await res_partner.create({
        id: 1,
        name: 'Admin Centime',
        email: adminEmail,
        notify_email: 'always',
        invoice_warn: 'no-message',
        sale_warn: 'no-message',
        purchase_warn: 'no-message',
        picking_warn: 'no-message',
        active: true,
        company_id: 1, // à adapter
      });
      console.log('✅ Partenaire créé avec ID = 1');
    }

    // 🔁 Vérifier si l’admin existe déjà
    const existing = await res_users.findOne({ where: { login: 'admin01' } });
    if (existing) {
      console.log('⚠️ Admin déjà existant :', existing.login);
      return process.exit(0);
    }

    // 🔐 Hash du mot de passe
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // 👤 Création de l'utilisateur admin
    const newAdmin = await res_users.create({
      login: 'admin01',
      email: adminEmail,
      password: hashedPassword,
      active: true,
      partner_id: partner.id,
      company_id: 1,
    });

    console.log('✅ Admin créé avec succès :', newAdmin.login);

    // 🔍 Recherche du groupe Admin
    const adminGroup = await res_groups.findOne({
      where: { name: { [Op.iLike]: '%admin%' } },
    });

    if (!adminGroup) {
      console.warn('❌ Groupe "Admin" introuvable.');
      return process.exit(1);
    }

    // 🔗 Liaison utilisateur ↔ groupe
    await res_users_res_groups_rel.create({
      uid: newAdmin.id,
      gid: adminGroup.id,
    });

    console.log(`🔐 Groupe "Admin" assigné à ${newAdmin.login}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors du seed admin :', err);
    process.exit(1);
  }
})();
