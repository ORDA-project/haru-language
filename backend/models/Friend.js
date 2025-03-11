const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Friend = sequelize.define("Friend", {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    friend_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
}, {
    tableName: "friends",
    timestamps: false
});

module.exports = Friend;
