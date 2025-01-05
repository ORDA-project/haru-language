const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // db.js 파일 경로

// User 모델 정의
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false, // NOT NULL
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // UNIQUE
  },
}, {
  timestamps: true, // createdAt, updatedAt 자동 생성
});

module.exports = User;