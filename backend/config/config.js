require("dotenv").config();

const base = {
  url: process.env.DATABASE_URL,   
  dialect: "mysql",
  dialectOptions: {
    connectTimeout: 60000,
    ssl: { rejectUnauthorized: false },
  },
  pool: { max: 5, min: 0, acquire: 60000, idle: 10000 },
};

module.exports = {
  production: { ...base },
  development: { ...base },
  test: { ...base },
};
