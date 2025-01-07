const { DataTypes } = require('sequelize');
const sequelize = require('../db');  // Sequelize 인스턴스

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  social_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  social_provider: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'users', // 테이블 이름 명시
  timestamps: true, // createdAt과 updatedAt 자동 생성
});

module.exports = User;
