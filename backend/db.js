require("dotenv").config();
const { Sequelize } = require("sequelize");
const config = require("./config/config.js");

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

const commonOptions = {
  dialect: dbConfig.dialect || "mysql",
  dialectOptions: dbConfig.dialectOptions || { ssl: { rejectUnauthorized: false } },
  pool: dbConfig.pool || { max: 5, min: 0, acquire: 60000, idle: 10000 },
  logging: false,
  // 필요하면 타임존 설정도 가능: timezone: '+09:00',
};

let sequelize;
if (dbConfig.url) {
  sequelize = new Sequelize(dbConfig.url, commonOptions);
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      ...commonOptions,
    }
  );
}

// 연결 테스트
(async () => {
  try {
    await sequelize.authenticate();
    if (process.env.NODE_ENV !== "production") {
      console.log("데이터베이스 연결 성공!");
    }
  } catch (error) {
    console.error("데이터베이스 연결 실패:", error.message);
    if (process.env.NODE_ENV !== "production") {
      console.error("상세 오류:", error);
    }
  }
})();

module.exports = sequelize;
