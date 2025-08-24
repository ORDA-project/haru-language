const { Sequelize } = require('sequelize');
const config = require('./config/config.js'); 

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Sequelize 인스턴스 생성
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false,
  }
);

// 연결 테스트
(async () => {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공!');
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error);
  }
})();

module.exports = sequelize;