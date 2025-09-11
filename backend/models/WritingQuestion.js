const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const WritingQuestion = sequelize.define("WritingQuestion", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    question_text: { 
        type: DataTypes.TEXT,
        allowNull: false,
    },
    korean_text: { 
        type: DataTypes.TEXT,
        allowNull: false,
    }
}, {
    tableName: "writing_questions",
    timestamps: true,
    underscored: true,    
});

module.exports = WritingQuestion;