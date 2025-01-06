const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Dialogue = sequelize.define('Dialogue', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  example_item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  speaker: {
    type: DataTypes.STRING(1), // 'A' 또는 'B'
    allowNull: false,
  },
  english: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  korean: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: 'dialogues',
});

module.exports = Dialogue;
