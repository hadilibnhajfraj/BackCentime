// src/server.js
require('dotenv').config();
const app = require('./app');
const { sequelize, Document, RendezVous, Disponibilite } = require('./models'); 
// ^ On ne récupère QUE les modèles custom à synchroniser

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL réussie.');

    // ❌ Ne JAMAIS sync les tables Odoo (res_*, hr_department, activity_activity, prestation_prestation)
    // ✅ Sync UNIQUEMENT les tables custom de ton app
    await Promise.all([
      Document.sync({ alter: true }),
      RendezVous.sync({ alter: true }),
      Disponibilite.sync({ alter: true }),
    ]);

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Impossible de connecter PostgreSQL :', err);
    process.exit(1);
  }
})();
