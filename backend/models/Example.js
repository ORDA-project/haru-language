const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const Example = sequelize.define('Example', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: "id" },
    onDelete: "CASCADE",
  },
  extracted_sentence: { type: DataTypes.TEXT, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  images: { 
    type: DataTypes.JSON, 
    allowNull: true,
    defaultValue: null,
    comment: '예문 생성에 사용된 이미지 URL 배열 (원본 + 추가 이미지들)'
  },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  timestamps: false,
  tableName: 'examples',
  underscored: true,
});

module.exports = Example;
