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
  underscored: true, // DB 컬럼명이 created_at, updated_at이므로 true로 변경
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
    order: [["created_at", "DESC"]],
  });

  if (lastActivity) {
    // underscored: true이므로 created_at 컬럼을 createdAt 속성으로 자동 매핑
    const createdAt = lastActivity.createdAt || lastActivity.created_at;
    
    // createdAt이 유효한지 확인
    if (!createdAt || isNaN(new Date(createdAt).getTime())) {
      // 유효하지 않은 날짜면 새 방문 기록 생성
      const newVisit = await UserActivity.create({
        user_id,
        visit_count: 1,
      });
      return newVisit;
    }
    
    const lastVisitDate = new Date(createdAt);
    lastVisitDate.setHours(0, 0, 0, 0);

    if (lastVisitDate.toDateString() === today.toDateString()) {
      const dayOfWeek = getDayOfWeek(today);
      return lastActivity;
    }

    const newVisit = await UserActivity.create({
      user_id,
      visit_count: lastActivity.visit_count + 1,
    });

    return newVisit;
  }

  const firstVisit = await UserActivity.create({ user_id, visit_count: 1 });
  return firstVisit;
};

// 가장 자주 방문한 요일과 요일별 횟수 반환
UserActivity.getMostVisitedDays = async function (user_id) {
  const activities = await UserActivity.findAll({
    where: { user_id },
    attributes: ["created_at"],
  });

  const dayCounts = {};

  for (const activity of activities) {
    // underscored: true이므로 created_at 컬럼을 createdAt 속성으로 자동 매핑
    const createdAt = activity.createdAt || activity.created_at;
    
    // 유효한 날짜인지 확인
    if (!createdAt || isNaN(new Date(createdAt).getTime())) {
      continue; // 유효하지 않은 날짜는 건너뛰기
    }
    
    const day = getDayOfWeek(new Date(createdAt));
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  }


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
    attributes: ["created_at"],
  });

  return activities.reduce((count, activity) => {
    // underscored: true이므로 created_at 컬럼을 createdAt 속성으로 자동 매핑
    const createdAt = activity.createdAt || activity.created_at;
    
    // 유효한 날짜인지 확인
    if (!createdAt || isNaN(new Date(createdAt).getTime())) {
      return count; // 유효하지 않은 날짜는 건너뛰기
    }
    
    const day = getDayOfWeek(new Date(createdAt));
    return day === targetDay ? count + 1 : count;
  }, 0);
};

module.exports = UserActivity;
