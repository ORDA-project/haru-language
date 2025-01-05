const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const ExampleItem = sequelize.define('ExampleItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  example_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  context: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: 'example_items',
});

module.exports = ExampleItem;