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
    defaultValue: 1, // 처음 로그인할 때 방문 횟수를 1로 설정
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.fn('NOW'), // 생성 시, 현재 날짜와 시간을 저장
  },
}, {
  tableName: "user_activities", // 정확한 테이블 이름 명시
  timestamps: true, // createdAt, updatedAt 자동 생성
});

// 방문 횟수 및 동적 요일 데이터 업데이트
UserActivity.updateVisit = async function (userId) {
  // 방문 기록 생성 또는 가져오기
  const [activity] = await UserActivity.findOrCreate({
    where: { user_id: userId },
    defaults: {
      visit_count: 1,  // 처음 방문 시 visit_count를 1로 설정
    },
  });

  // 방문 횟수 증가
  activity.visit_count += 1;
  await activity.save();

  return activity; // 업데이트된 활동 반환
};

// 가장 많이 방문한 요일 계산
UserActivity.getMostVisitedDay = async function (userId) {
  // 해당 사용자의 모든 활동 기록 가져오기
  const activities = await UserActivity.findAll({
    where: { user_id: userId },
    attributes: ['createdAt'], // createdAt만 가져오기
  });

  // 요일별 방문 횟수 계산
  const dayCounts = activities.reduce((counts, activity) => {
    const day = new Date(activity.createdAt).toLocaleDateString("en-US", { weekday: "long" });
    counts[day] = (counts[day] || 1) + 1; // 요일별 카운트 증가
    return counts;
  }, {});

  // 방문 횟수가 가장 많은 요일 찾기
  const mostVisitedDay = Object.keys(dayCounts).reduce((a, b) =>
    dayCounts[a] > dayCounts[b] ? a : b
  );

  return {
    mostVisitedDay,
    visitCounts: dayCounts[mostVisitedDay],
  }; // 요일과 방문 횟수를 반환
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
