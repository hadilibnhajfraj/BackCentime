module.exports = (sequelize, DataTypes) => {
  return sequelize.define('res_partner', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING
  }, {
    tableName: 'res_partner',
    timestamps: false
  });
};
