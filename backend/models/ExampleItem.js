const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Example = require('./Example');

const ExampleItem = sequelize.define('ExampleItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  example_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Example, key: "id" },
    onDelete: "CASCADE",
  },
  context: { type: DataTypes.TEXT, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  timestamps: false,
  tableName: 'example_items',
});

module.exports = ExampleItem;
