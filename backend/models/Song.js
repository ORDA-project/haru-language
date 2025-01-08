const { DataTypes } = require('sequelize');
const sequelize = require('../db');  // Sequelize 인스턴스

const Song = sequelize.define('Song', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  artist: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'songs', // 테이블 이름 명시
  timestamps: true, // createdAt과 updatedAt 자동 생성
});

module.exports = Song;