const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const User = require("./User");

// 허용된 교재 리스트
const VALID_BOOK_LIST = ["none", "travel_conversation", "daily_conversation", "english_novel", "textbook"];

const UserBook = sequelize.define("UserBook", { 
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
    book: {
        type: DataTypes.STRING, 
        allowNull: false,
        validate: {
            isIn: {
                args: [VALID_BOOK_LIST],
                msg: `Invalid book type! Allowed values: ${VALID_BOOK_LIST.join(", ")}`,
            },
        },
    },
}, {
    tableName: "user_books",
    timestamps: false,
});

module.exports = UserBook;
