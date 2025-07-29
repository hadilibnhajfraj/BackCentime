module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define(
    'Department',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true, // Génère automatiquement via SERIAL en PostgreSQL
      },
      create_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      write_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'hr_department',
      timestamps: false,
    },
  );

  return Department;
};
