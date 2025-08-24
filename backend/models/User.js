const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const User = sequelize.define("User", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    social_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    social_provider: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    gender: {
        type: DataTypes.ENUM("male", "female", "private"),
        allowNull: true,
    },
    goal: {
        type: DataTypes.ENUM("hobby", "exam", "business", "travel"),
        allowNull: true,
    }
}, {
    tableName: "users",
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
});

module.exports = User;
