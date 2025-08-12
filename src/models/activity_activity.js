// Activity (public.activity_activity)
module.exports = (sequelize, DataTypes) => {
  const Activity = sequelize.define('Activity', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    createUid: { type: DataTypes.INTEGER, field: 'create_uid' },
    description: { type: DataTypes.TEXT, field: 'description' },
    writeUid: { type: DataTypes.INTEGER, field: 'write_uid' },
    parentId: { type: DataTypes.INTEGER, field: 'parent_id' },
    writeDate: { type: DataTypes.DATE, field: 'write_date' },
    createDate: { type: DataTypes.DATE, field: 'create_date' },
    name: { type: DataTypes.STRING, field: 'name' },
    rubriqueId: { type: DataTypes.INTEGER, field: 'rubrique_id' },
  }, {
    tableName: 'activity_activity',
    timestamps: false,
    underscored: true,
    freezeTableName: true,
  });

  Activity.associate = (models) => {
    Activity.hasMany(models.Prestation, { foreignKey: 'activity_id', as: 'prestations' });
  };

  return Activity;
};
