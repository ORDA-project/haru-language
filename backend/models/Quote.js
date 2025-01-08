const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // Sequelize 초기화 파일 경로

const Quote = sequelize.define('Quote', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users', // 유저 테이블 이름
      key: 'id',
    },
  },
  quote: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  translation: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'Quotes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Quote;