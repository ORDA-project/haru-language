const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Notification = sequelize.define("Notification", {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: "notifications",
    timestamps: false,
    underscored: false
});

module.exports = Notification;
