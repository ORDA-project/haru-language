const sequelize = require('../db');
const { Sequelize } = require("sequelize");
const Question = require('./Question');
const Answer = require('./Answer');
const Example = require('./Example');
const ExampleItem = require('./ExampleItem');
const Dialogue = require('./Dialogue');
const Song = require('./Song');
const User = require('./User');
const UserActivity = require('./UserActivity');
const UserInterest = require("./UserInterest");
const UserBook = require("./UserBook");
const WritingQuestion = require("./WritingQuestion");
const WritingRecord = require("./WritingRecord");
const WritingExample = require("./WritingExample");


// 관계 설정
Question.hasMany(Answer, { foreignKey: 'question_id', onDelete: 'CASCADE' });
Answer.belongsTo(Question, { foreignKey: 'question_id' });

Example.hasMany(ExampleItem, { foreignKey: 'example_id', onDelete: 'CASCADE' });
ExampleItem.belongsTo(Example, { foreignKey: 'example_id' });

ExampleItem.hasMany(Dialogue, { foreignKey: 'example_item_id', onDelete: 'CASCADE' });
Dialogue.belongsTo(ExampleItem, { foreignKey: 'example_item_id' });

User.hasOne(UserActivity, { foreignKey: 'user_id' });  
UserActivity.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(UserInterest, { foreignKey: "user_id", onDelete: "CASCADE" });
UserInterest.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(UserBook, { foreignKey: "user_id", onDelete: "CASCADE" });
UserBook.belongsTo(User, { foreignKey: "user_id" });

WritingQuestion.hasMany(WritingExample, { foreignKey: "writing_question_id", onDelete: "CASCADE" });
WritingExample.belongsTo(WritingQuestion, { foreignKey: "writing_question_id" });


module.exports = {
    sequelize,
    Sequelize,
    Question,
    Answer,
    Example,
    ExampleItem,
    Dialogue,
    Song,
    User,
    UserActivity,
    UserInterest,
    UserBook,
    WritingQuestion,
    WritingRecord,
    WritingExample,
  };
