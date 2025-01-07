'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

// Sequelize 인스턴스 생성
let sequelize;
if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// 모델 파일 불러오기
fs.readdirSync(__dirname)
    .filter((file) => {
        return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
    })
    .forEach((file) => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
    });

// 모델 간 관계 설정
Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

// 관계 설정을 위한 추가 코드
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

// DB 객체에 추가
db.Question = Question;
db.Answer = Answer;
db.Example = Example;
db.ExampleItem = ExampleItem;
db.Dialogue = Dialogue;

// Sequelize 인스턴스 추가
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
