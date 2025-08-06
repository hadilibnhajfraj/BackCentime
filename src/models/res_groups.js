// src/models/res_groups.js
module.exports = (sequelize, DataTypes) => {
  const res_groups = sequelize.define('res_groups', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    name: DataTypes.STRING,
    comment: DataTypes.TEXT,
    create_uid: DataTypes.INTEGER,
    color: DataTypes.INTEGER,
    share: DataTypes.BOOLEAN,
    write_uid: DataTypes.INTEGER,
    write_date: DataTypes.DATE,
    create_date: DataTypes.DATE,
    category_id: DataTypes.INTEGER
  }, {
    tableName: 'res_groups',
    timestamps: false,
    underscored: true,
    freezeTableName: true 
  });

  return res_groups;
};
