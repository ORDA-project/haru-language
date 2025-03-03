const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const User = require("./User");

// 허용된 관심사 리스트
const VALID_INTEREST_LIST = ["conversation", "reading", "grammar", "business", "vocabulary"];

const UserInterest = sequelize.define("UserInterest", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: "id",
        },
        onDelete: "CASCADE",
    },
    interest: {
        type: DataTypes.STRING, 
        allowNull: false,
        validate: {
            isIn: {
                args: [VALID_INTEREST_LIST],
                msg: `Invalid interest! Allowed values: ${VALID_INTEREST_LIST.join(", ")}`,
            },
        },
    },
}, {
    tableName: "user_interests",
    timestamps: false,
});

module.exports = UserInterest;
