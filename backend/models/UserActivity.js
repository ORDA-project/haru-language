const { DataTypes } = require('sequelize');
const sequelize = require('../db');  // Sequelize 인스턴스

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
      model: "users",  // 연결된 테이블 이름
      key: "id",       // 참조하는 필드
    },
  },
  visit_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  most_visited_day: {
    type: DataTypes.STRING,
  },
  sunday_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  monday_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  tuesday_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  wednesday_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  thursday_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  friday_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  saturday_count: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: "user_activities", // 정확한 테이블 이름 명시
  timestamps: true, // createdAt, updatedAt 자동 생성
});

// 방문 횟수 및 요일별 데이터 업데이트
UserActivity.updateVisit = async function (userId) {
  const today = new Date();
  const currentDay = today.toLocaleDateString("en-US", { weekday: "long" });

  // 방문 기록 생성 또는 가져오기
  const [activity] = await UserActivity.findOrCreate({
    where: { user_id: userId },
    defaults: {
      visit_count: 0,
      most_visited_day: null,
    },
  });

  // 방문 횟수와 해당 요일 증가
  activity.visit_count += 1;

  const dayField = `${currentDay.toLowerCase()}_count`;
  if (activity[dayField] !== undefined) {
    activity[dayField] += 1;
  }

  await activity.save(); // 저장

  // 가장 많이 방문한 요일 업데이트
  await UserActivity.updateMostVisitedDay(userId);
};

// 가장 많이 방문한 요일 계산
UserActivity.updateMostVisitedDay = async function (userId) {
  const activity = await UserActivity.findOne({ where: { user_id: userId } });

  if (!activity) {
    return;
  }

  const dayCounts = {
    Sunday: activity.sunday_count,
    Monday: activity.monday_count,
    Tuesday: activity.tuesday_count,
    Wednesday: activity.wednesday_count,
    Thursday: activity.thursday_count,
    Friday: activity.friday_count,
    Saturday: activity.saturday_count,
  };

  // 방문 횟수가 가장 많은 요일 계산
  const mostVisitedDay = Object.keys(dayCounts).reduce((a, b) =>
    dayCounts[a] > dayCounts[b] ? a : b
  );

  activity.most_visited_day = mostVisitedDay;
  await activity.save(); // 저장
};

module.exports = UserActivity;
