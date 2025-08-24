// Friend.js (replace all)
const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const User = require("./User");

const Friend = sequelize.define("Friend", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: "id" },
    onDelete: "CASCADE",
  },
  friend_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: "id" },
    onDelete: "CASCADE",
  },
}, {
  tableName: "friends",
  timestamps: false,
  indexes: [
    { unique: true, fields: ["user_id", "friend_id"] }, // 중복 관계 방지
  ],
});

module.exports = Friend;
