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
  underscored: false,
});

module.exports = Song;