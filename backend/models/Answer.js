const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Question = require('./Question');

const Answer = sequelize.define('Answer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Question, key: "id" },
    onDelete: "CASCADE",
  },
  content: { type: DataTypes.TEXT, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  timestamps: false,
  tableName: 'answers',
});

module.exports = Answer;
