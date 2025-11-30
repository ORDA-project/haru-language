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
  tableName: 'songs', 
  timestamps: true, 
  underscored: true, // DB 컬럼명이 created_at, updated_at이므로 true로 변경
});

module.exports = Song;