// src/server.js
require('dotenv').config(); // DOIT être tout en haut

const app = require('./app');
const { sequelize, Document, RendezVous, Disponibilite } = require('./models');

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL réussie.');

    // ⚠️ Ne jamais sync les tables Odoo
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
