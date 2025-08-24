const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const User = require("./User");

const Invitation = sequelize.define("Invitation", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  inviter_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: "id" },
    onDelete: "CASCADE",
  },
  invitee_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: User, key: "id" },
    onDelete: "SET NULL",
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM("pending", "accepted", "rejected"),
    defaultValue: "pending"
  }
}, {
  tableName: "invitations",
  timestamps: true,
  underscored: true
});

module.exports = Invitation;
