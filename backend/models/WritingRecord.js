module.exports = (sequelize, DataTypes) => {
    const WritingRecord = sequelize.define("WritingRecord", {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      writing_question_id: {
        type: DataTypes.INTEGER, 
        allowNull: true, 
      },
      original_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      processed_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      feedback: {
        type: DataTypes.JSON, 
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("translation", "correction"),
        allowNull: false,
      },
    });
  
    return WritingRecord;
  };
  