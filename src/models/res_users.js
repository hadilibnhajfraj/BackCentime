// src/models/res_users.js

module.exports = (sequelize, DataTypes) => {
  const res_users = sequelize.define('res_users', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    active: DataTypes.BOOLEAN,
    login: {
      type: DataTypes.STRING,
      unique: true
    },
    password: DataTypes.STRING,
    company_id: DataTypes.INTEGER,
    partner_id: DataTypes.INTEGER,
    create_date: DataTypes.DATE,
    share: DataTypes.BOOLEAN,
    write_uid: DataTypes.INTEGER,
    create_uid: DataTypes.INTEGER,
    action_id: DataTypes.INTEGER,
    write_date: DataTypes.DATE,
    signature: DataTypes.TEXT,
    password_crypt: DataTypes.STRING,
    alias_id: DataTypes.INTEGER,
    sale_team_id: DataTypes.INTEGER,
    target_sales_done: DataTypes.INTEGER,
    target_sales_won: DataTypes.INTEGER,
    target_sales_invoiced: DataTypes.INTEGER,
    helpdesk_target_closed: DataTypes.INTEGER,
    helpdesk_target_rating: DataTypes.INTEGER,
    helpdesk_target_success: DataTypes.INTEGER
  }, {
    tableName: 'res_users',
    timestamps: false,
    underscored: true,
    freezeTableName: true 
  });

  return res_users;
};
