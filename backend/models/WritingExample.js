const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const WritingExample = sequelize.define("WritingExample", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    writing_question_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "writing_questions", 
            key: "id",
        },
        onDelete: "CASCADE",
    },
    example: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    translation: {
        type: DataTypes.TEXT,
        allowNull: false,
    }
}, {
    tableName: "writing_examples",
    timestamps: true,
});

module.exports = WritingExample;