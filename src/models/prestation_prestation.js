// models/Prestation.js
module.exports = (sequelize, DataTypes) => {
  const Prestation = sequelize.define(
    'Prestation',
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },

      aliasId: { type: DataTypes.INTEGER, field: 'alias_id' },
      writeUid: { type: DataTypes.INTEGER, field: 'write_uid' },
      departmentId: { type: DataTypes.INTEGER, field: 'department_id' },
      teamLeaderId: { type: DataTypes.INTEGER, field: 'team_leader_id' },

      taxes: { type: DataTypes.DECIMAL, field: 'taxes' },
      t: { type: DataTypes.BOOLEAN, field: 't' },

      aliasModel: {
        type: DataTypes.STRING,
        field: 'alias_model',
        allowNull: false,
        defaultValue: 'project.task',
      },
      createDate: { type: DataTypes.DATE, field: 'create_date' },
      sequence: { type: DataTypes.INTEGER, field: 'sequence' },

      // analytic_account_id : non obligatoire + entier par défaut
      accountAnalyticId: {
        type: DataTypes.INTEGER,
        field: 'analytic_account_id',
        allowNull: true,
        defaultValue: 1,
      },

      // country_id : NOT NULL en base → default côté modèle aussi
      countryId: {
        type: DataTypes.INTEGER,
        field: 'country_id',
        allowNull: false,
        defaultValue: 223, // Tunisie
      },

      allowTimesheets: { type: DataTypes.BOOLEAN, field: 'allow_timesheets' },
      active: { type: DataTypes.BOOLEAN, field: 'active' },
      userId: { type: DataTypes.INTEGER, field: 'user_id' },
      resourceCalendarId: { type: DataTypes.INTEGER, field: 'resource_calendar_id' },

      methodologyCadrage: { type: DataTypes.BOOLEAN, field: 'methodology_cadrage' },
      desctiption: { type: DataTypes.TEXT, field: 'desctiption' }, // orthographe exacte
      responsibleId: { type: DataTypes.INTEGER, field: 'responsible_id' },
      color: { type: DataTypes.INTEGER, field: 'color' },
      createUid: { type: DataTypes.INTEGER, field: 'create_uid' },
      messageLastPost: { type: DataTypes.DATE, field: 'message_last_post' },

      riskIntegrity: { type: DataTypes.BOOLEAN, field: 'risk_integrity' },
      penaliteRetard: { type: DataTypes.DECIMAL, field: 'penalite_retard' },

      iat: { type: DataTypes.STRING, field: 'iat' },
      subtaskProjectId: { type: DataTypes.INTEGER, field: 'subtask_project_id' },

      dateCreation: { type: DataTypes.DATEONLY, field: 'date_creation' },
      activityId: { type: DataTypes.INTEGER, field: 'activity_id' },

      labelTasks: { type: DataTypes.STRING, field: 'label_tasks' },

      privacyVisibility: {
        type: DataTypes.STRING,
        field: 'privacy_visibility',
        allowNull: false,
        defaultValue: 'employees',
      },

      dateStart: { type: DataTypes.DATEONLY, field: 'date_start' },
      paymentModality: { type: DataTypes.STRING, field: 'payment_modality' },

      writeDate: { type: DataTypes.DATE, field: 'write_date' },
      date: { type: DataTypes.DATEONLY, field: 'date' },

      prestation: { type: DataTypes.STRING, field: 'prestation' },
      referenceBordereau: { type: DataTypes.STRING, field: 'reference_bordereau' },

      namePrimary: { type: DataTypes.STRING, field: 'name_primary' },
      sequencePres: { type: DataTypes.INTEGER, field: 'sequence_pres' },

      iatCase: { type: DataTypes.BOOLEAN, field: 'iat_case' },
      iatNumber: { type: DataTypes.INTEGER, field: 'iat_number' },

      state: { type: DataTypes.STRING, field: 'state' },

      responsible1Id: { type: DataTypes.INTEGER, field: 'responsible1_id' },
      teamLeader1Id: { type: DataTypes.INTEGER, field: 'team_leader1_id' },

      entete: { type: DataTypes.TEXT, field: 'entete' },
      flagCreate: { type: DataTypes.BOOLEAN, field: 'flag_create' },

      amountDop: { type: DataTypes.DECIMAL, field: 'amount_dop' },
      superUser: { type: DataTypes.BOOLEAN, field: 'super_user' },
      isSaleManager: { type: DataTypes.BOOLEAN, field: 'is__sale_manager' },

      intervenats: { type: DataTypes.TEXT, field: 'intervenats' }, // (orthographe colonne)
      dateStartPrevue: { type: DataTypes.DATEONLY, field: 'date_start_prevue' },

      lastUpdateTeamLeader: { type: DataTypes.DATE, field: 'last_update_team_leader' },
      officeOrderId: { type: DataTypes.INTEGER, field: 'office_order_id' },

      sequenceTri: { type: DataTypes.INTEGER, field: 'sequence_tri' },

      currentUser: { type: DataTypes.INTEGER, field: 'current_user' },
      statePaymentId: { type: DataTypes.INTEGER, field: 'state_payment_id' },
      productProductId: { type: DataTypes.INTEGER, field: 'product_product_id' },
    },
    {
      tableName: 'prestation_prestation',
      timestamps: false,
      underscored: true,
      freezeTableName: true,
    },
  );

  Prestation.associate = (models) => {
    Prestation.belongsTo(models.Activity, {
      foreignKey: 'activity_id',
      as: 'activity',
    });
    Prestation.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department',
    });
    Prestation.hasMany(models.Document, {
      foreignKey: 'prestation_id',
      as: 'documents',
    });
  };

  return Prestation;
};
