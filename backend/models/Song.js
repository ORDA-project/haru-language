const { DataTypes } = require('sequelize');
const sequelize = require('../db');  

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
  timestamps: true, // created_at과 updated_at 자동 생성
});

module.exports = Song;