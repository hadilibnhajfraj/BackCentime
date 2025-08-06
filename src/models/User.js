module.exports = (sequelize, DataTypes) => {
  const res_users = sequelize.define(
    'res_users',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      login: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      partner_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      create_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      share: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      write_uid: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      create_uid: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      action_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      write_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      signature: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      password_crypt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      alias_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sale_team_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      target_sales_done: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      target_sales_won: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      target_sales_invoiced: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      helpdesk_target_closed: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      helpdesk_target_rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      helpdesk_target_success: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'res_users',
      timestamps: false,
      underscored: true,
    },
  );

  // Associations (si tu les déclares dans ce fichier)
  res_users.associate = (models) => {
    res_users.belongsTo(models.res_partner, {
      foreignKey: 'partner_id',
      as: 'partner',
    });

    res_users.belongsToMany(models.res_groups, {
      through: models.res_users_res_groups_rel,
      foreignKey: 'uid',
      otherKey: 'gid',
      as: 'groups',
    });
  };

  return res_users;
};
