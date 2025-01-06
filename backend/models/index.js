const sequelize = require('../db');
const Question = require('./Question');
const Answer = require('./Answer');
const Example = require('./Example');
const ExampleItem = require('./ExampleItem');
const Dialogue = require('./Dialogue');

// 관계 설정
Question.hasMany(Answer, { foreignKey: 'question_id', onDelete: 'CASCADE' });
Answer.belongsTo(Question, { foreignKey: 'question_id' });

Example.hasMany(ExampleItem, { foreignKey: 'example_id', onDelete: 'CASCADE' });
ExampleItem.belongsTo(Example, { foreignKey: 'example_id' });

ExampleItem.hasMany(Dialogue, { foreignKey: 'example_item_id', onDelete: 'CASCADE' });
Dialogue.belongsTo(ExampleItem, { foreignKey: 'example_item_id' });

module.exports = {
  sequelize,
  Question,
  Answer,
  Example,
  ExampleItem,
  Dialogue,
};
