const { res_groups } = require('../models');

async function insertDefaultGroups() {
  const defaultGroups = [
    { id: 1001, name: 'admin', comment: 'Administrateur système' },
    { id: 1002, name: 'agent', comment: 'Agent CETIME' },
    { id: 1003, name: 'client', comment: 'Client CETIME' }
  ];

  for (const group of defaultGroups) {
    const exists = await res_groups.findOne({ where: { name: group.name } });
    if (!exists) {
      await res_groups.create(group);
      console.log(`✅ Groupe ${group.name} inséré`);
    } else {
      console.log(`ℹ️ Groupe ${group.name} existe déjà`);
    }
  }
}

insertDefaultGroups()
  .then(() => {
    console.log('✅ Insertion terminée');
    process.exit();
  })
  .catch(err => {
    console.error('❌ Erreur insertion groupes:', err);
    process.exit(1);
  });
