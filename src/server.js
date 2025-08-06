// src/server.js
require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL réussie.');

    // ❌ Ne jamais synchroniser ici les tables Odoo comme res_partner
    // ✅ Synchroniser uniquement tes modèles personnalisés
    const { Dossier, Document, Department, RendezVous, Disponibilite } = require('./models');

    await Dossier.sync({ alter: true });
    await Document.sync({ alter: true });
    await Department.sync({ alter: true });
    await RendezVous.sync({ alter: true });
    await Disponibilite.sync({ alter: true });

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Impossible de connecter PostgreSQL :', err);
    process.exit(1);
  }
})();
