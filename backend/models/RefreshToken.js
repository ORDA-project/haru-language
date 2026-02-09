const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const RefreshToken = sequelize.define("RefreshToken", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "users",
            key: "id",
        },
        onDelete: "CASCADE",
    },
    token: {
        type: DataTypes.STRING(500),
        allowNull: false,
        unique: true,
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: "refresh_tokens",
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ["user_id"],
        },
        {
            fields: ["token"],
            unique: true,
        },
        {
            fields: ["expires_at"],
        },
    ],
});

module.exports = RefreshToken;

