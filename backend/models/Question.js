const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false, // createdAt, updatedAt 사용 안 함
  tableName: 'questions', // 테이블 이름 명시
});

module.exports = Question;