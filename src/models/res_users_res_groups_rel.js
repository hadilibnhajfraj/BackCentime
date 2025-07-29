// src/models/res_users_res_groups_rel.js

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('res_users_res_groups_rel', {
    uid: DataTypes.INTEGER,
    gid: DataTypes.INTEGER
  }, {
    tableName: 'res_users_res_groups_rel',
    timestamps: false
  });
};
