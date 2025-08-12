// Department (public.hr_department)
module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define('Department', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    createDate: { type: DataTypes.DATE, field: 'create_date' },
    color: { type: DataTypes.INTEGER, field: 'color' },
    writeUid: { type: DataTypes.INTEGER, field: 'write_uid' },
    createUid: { type: DataTypes.INTEGER, field: 'create_uid' },
    parentId: { type: DataTypes.INTEGER, field: 'parent_id' },
    messageLastPost: { type: DataTypes.DATE, field: 'message_last_post' },
    companyId: { type: DataTypes.INTEGER, field: 'company_id' },
    note: { type: DataTypes.TEXT, field: 'note' },
    managerId: { type: DataTypes.INTEGER, field: 'manager_id' },
    writeDate: { type: DataTypes.DATE, field: 'write_date' },
    active: { type: DataTypes.BOOLEAN, field: 'active' },
    name: { type: DataTypes.STRING, field: 'name' },
    code: { type: DataTypes.STRING, field: 'code' },
    accountAnalyticId: { type: DataTypes.INTEGER, field: 'account_analytic_id' },
    lab: { type: DataTypes.BOOLEAN, field: 'lab' },
    depType: { type: DataTypes.STRING, field: 'dep_type' },
    analyticType: { type: DataTypes.STRING, field: 'analytic_type' },
  }, {
    tableName: 'hr_department',
    timestamps: false,
    underscored: true,
    freezeTableName: true,
  });

  Department.associate = (models) => {
    Department.hasMany(models.Prestation, { foreignKey: 'department_id', as: 'prestations' });
  };

  return Department;
};
