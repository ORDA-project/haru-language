module.exports = (sequelize, DataTypes) => {
    const WritingQuestion = sequelize.define("WritingQuestion", {
      question_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      }
    });
  
    return WritingQuestion;
  };
  