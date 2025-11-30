const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const User = require("./User");

const Notification = sequelize.define("Notification", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: "id" },
    onDelete: "CASCADE",
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: "id" },
    onDelete: "CASCADE",
  },
  message: { type: DataTypes.STRING, allowNull: false },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
}, {
  tableName: "notifications",
  timestamps: false,    // createdAt을 수동으로 정의했으므로 false 유지
  underscored: true,    // 표기 일관화 권장
});

module.exports = Notification;
