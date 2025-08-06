module.exports = (sequelize, DataTypes) => {
  const Rel = sequelize.define(
    'res_groups_users_rel',
    {
      uid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: 'res_users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      gid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: 'res_groups',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
    },
    {
      tableName: 'res_groups_users_rel',
      timestamps: false,
      freezeTableName: true,
    },
  );

  return Rel;
};
