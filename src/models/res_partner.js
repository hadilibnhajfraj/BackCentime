module.exports = (sequelize, DataTypes) => {
  const res_partner = sequelize.define(
    'res_partner',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true },
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      phone: DataTypes.STRING,
      company_id: DataTypes.INTEGER,
      comment: DataTypes.TEXT,
      website: DataTypes.STRING,
      create_date: DataTypes.DATE,
      color: DataTypes.INTEGER,
      active: DataTypes.BOOLEAN,
      street: DataTypes.STRING,
      supplier: DataTypes.BOOLEAN,
      city: DataTypes.STRING,
      display_name: DataTypes.STRING,
      zip: DataTypes.STRING,
      title: DataTypes.INTEGER,
      country_id: DataTypes.INTEGER,
      notify_email: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'always',
      },

      // ✅ CHAMPS OBLIGATOIRES AJOUTÉS
      invoice_warn: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'no-message',
      },
      sale_warn: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'no-message',
      },
      purchase_warn: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'no-message',
      },
      picking_warn: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'no-message',
      },
    },
    {
      tableName: 'res_partner',
      timestamps: false,
      underscored: true,
      freezeTableName: true,
    },
  );

  return res_partner;
};
