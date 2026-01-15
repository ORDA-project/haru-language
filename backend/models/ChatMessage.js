const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const ChatMessage = sequelize.define('ChatMessage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: "id" },
    onDelete: "CASCADE",
  },
  type: {
    type: DataTypes.ENUM('user', 'ai'),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  examples: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    // Question과 연결 (선택적)
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: 'chat_messages',
  indexes: [
    { fields: ['user_id', 'created_at'] },
    { fields: ['user_id'] },
  ],
});

module.exports = ChatMessage;

