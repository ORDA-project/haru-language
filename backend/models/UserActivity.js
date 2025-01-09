const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // Sequelize 인스턴스

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
      model: "users", // 연결된 테이블 이름
      key: "id", // 참조하는 필드
    },
  },
  visit_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  most_visited_day: {
    type: DataTypes.STRING,
  },
}, {
  tableName: "user_activities", // 정확한 테이블 이름 명시
  timestamps: true, // createdAt, updatedAt 자동 생성
});

// 방문 횟수 및 동적 요일 데이터 업데이트
UserActivity.updateVisit = async function (userId) {
  const today = new Date();

  // 방문 기록 생성 또는 가져오기
  const [activity] = await UserActivity.findOrCreate({
    where: { user_id: userId },
    defaults: {
      visit_count: 0,
      most_visited_day: null,
    },
  });

  // 방문 횟수 증가
  activity.visit_count += 1;
  await activity.save();

  // 가장 많이 방문한 요일 업데이트
  await UserActivity.updateMostVisitedDay(userId);
};

// 가장 많이 방문한 요일 계산
UserActivity.updateMostVisitedDay = async function (userId) {
  // 해당 사용자의 모든 활동 기록 가져오기
  const activities = await UserActivity.findAll({
    where: { user_id: userId },
    attributes: ['createdAt'], // createdAt만 가져오기
  });

  // 요일별 방문 횟수 계산
  const dayCounts = activities.reduce((counts, activity) => {
    const day = new Date(activity.createdAt).toLocaleDateString("en-US", { weekday: "long" });
    counts[day] = (counts[day] || 0) + 1;
    return counts;
  }, {});

  // 방문 횟수가 가장 많은 요일 계산
  const mostVisitedDay = Object.keys(dayCounts).reduce((a, b) =>
    dayCounts[a] > dayCounts[b] ? a : b
  );

  // most_visited_day 업데이트
  const activity = await UserActivity.findOne({ where: { user_id: userId } });
  activity.most_visited_day = mostVisitedDay;
  await activity.save();
};

// 특정 요일별 방문 횟수 계산 함수
UserActivity.getDayCount = async function (userId, day) {
  const activities = await UserActivity.findAll({
    where: { user_id: userId },
    attributes: ['createdAt'], // createdAt만 가져오기
  });

  // 해당 요일 방문 횟수 계산
  return activities.reduce((count, activity) => {
    const activityDay = new Date(activity.createdAt).toLocaleDateString("en-US", { weekday: "long" });
    return activityDay === day ? count + 1 : count;
  }, 0);
};

module.exports = UserActivity;
