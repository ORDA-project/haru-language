const { DataTypes } = require("sequelize");
const sequelize = require("../db");

// UserActivity 모델 정의
const UserActivity = sequelize.define("UserActivity", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "users",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  visit_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
}, {
  tableName: "user_activities",
  timestamps: true,
  underscored: true,
});

// 공통 요일 포맷터
const getDayOfWeek = (date) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "Asia/Seoul",
  }).format(date);

// 방문 기록 업데이트
UserActivity.updateVisit = async function (user_id) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActivity = await UserActivity.findOne({
    where: { user_id },
    order: [["createdAt", "DESC"]],
  });

  if (lastActivity) {
    const lastVisitDate = new Date(lastActivity.createdAt);
    lastVisitDate.setHours(0, 0, 0, 0);

    if (lastVisitDate.toDateString() === today.toDateString()) {
      const dayOfWeek = getDayOfWeek(today);
      console.log(`${dayOfWeek} 재방문: visit_count 유지 (${lastActivity.visit_count})`);
      return lastActivity;
    }

    const newVisit = await UserActivity.create({
      user_id,
      visit_count: lastActivity.visit_count + 1,
    });

    const dayOfWeek = getDayOfWeek(today);
    console.log(`${dayOfWeek} 첫 방문: visit_count 증가 (${newVisit.visit_count})`);
    return newVisit;
  }

  const firstVisit = await UserActivity.create({ user_id, visit_count: 1 });
  console.log("첫 로그인: visit_count = 1");
  return firstVisit;
};

// 가장 자주 방문한 요일과 요일별 횟수 반환
UserActivity.getMostVisitedDays = async function (user_id) {
  const activities = await UserActivity.findAll({
    where: { user_id },
    attributes: ["createdAt"],
  });

  const dayCounts = {};

  for (const { createdAt } of activities) {
    const day = getDayOfWeek(new Date(createdAt));
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  }

  console.log("요일별 방문 횟수:", dayCounts);

  const max = Math.max(...Object.values(dayCounts));
  const mostVisitedDays = Object.entries(dayCounts)
    .filter(([_, count]) => count === max)
    .map(([day]) => day);

  return { mostVisitedDays, visitCounts: dayCounts };
};

// 특정 요일 누적 방문 수
UserActivity.getDayCount = async function (user_id, targetDay) {
  const activities = await UserActivity.findAll({
    where: { user_id },
    attributes: ["createdAt"],
  });

  return activities.reduce((count, { createdAt }) => {
    const day = getDayOfWeek(new Date(createdAt));
    return day === targetDay ? count + 1 : count;
  }, 0);
};

module.exports = UserActivity;
