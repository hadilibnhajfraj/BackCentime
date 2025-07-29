'use strict';
module.exports = (sequelize, DataTypes) => {
  const ChatbotSession = sequelize.define('ChatbotSession', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // TODO: add attributes
  }, {
    tableName: 'chatbot_sessions',
    underscored: true,
  });
  ChatbotSession.associate = function(models) {
    // associations
  };
  return ChatbotSession;
};
