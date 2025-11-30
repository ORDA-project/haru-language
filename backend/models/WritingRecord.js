const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const User = require("./User");
const WritingQuestion = require("./WritingQuestion");

const WritingRecord = sequelize.define("WritingRecord", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: "id" },
    onDelete: "CASCADE",
  },
  writing_question_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // correction 타입은 질문 없이도 가능
    references: { model: WritingQuestion, key: "id" },
    onDelete: "CASCADE",
  },
  original_text: { type: DataTypes.TEXT, allowNull: false },
  processed_text: { type: DataTypes.TEXT, allowNull: false },
  feedback: { type: DataTypes.TEXT, allowNull: true },
  type: { type: DataTypes.ENUM("correction", "translation", "english_to_korean"), allowNull: false },
}, {
  tableName: "writing_records",
  timestamps: true,
  underscored: true,    // 추가: createdAt → created_at 매핑
});

module.exports = WritingRecord;