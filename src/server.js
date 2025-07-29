// src/server.js
require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL réussie.');

  await sequelize.sync({ alter: true });
// tu peux ajouter { alter: true } si nécessaire

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Impossible de connecter PostgreSQL :', err);
    process.exit(1);
  }
})();
