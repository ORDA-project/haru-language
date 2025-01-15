const { DataTypes, Op } = require('sequelize');
const sequelize = require('../db'); // 데이터베이스 연결을 위한 Sequelize 인스턴스 가져오기

const UserActivity = sequelize.define("UserActivity", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true, // 자동 증가 ID
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // 필수 입력 값
    references: {
      model: "users", // 참조할 테이블 이름
      key: "id", // 참조할 테이블의 필드
    },
  },
  visit_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1, // 초기 방문 횟수를 1로 설정
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'), // 생성 시 자동으로 현재 시간 설정
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  },
}, {
  tableName: "user_activities", // 데이터베이스 테이블 이름 명시
  timestamps: true, // createdAt 및 updatedAt 자동 관리
});

// 방문 횟수 업데이트 또는 새로운 방문 기록 생성 함수
UserActivity.updateVisit = async function (userId) {
  // 오늘 날짜를 기준으로 데이터를 검색
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 시간을 0으로 설정해 날짜만 비교

  const userActivity = await UserActivity.findOne({
    where: {
      user_id: userId,
      createdAt: {
        [Op.gte]: today, // 오늘 이후 생성된 기록 검색
      },
    },
  });

  if (userActivity) {
    // 오늘 이미 방문한 기록이 있다면 visit_count 증가
    userActivity.visit_count += 1;
    await userActivity.save();
    console.log("오늘 이미 방문한 기록 업데이트:", userActivity);
    return userActivity;
  }

  // 오늘 첫 방문이라면 새 기록 생성
  const newUserActivity = await UserActivity.create({
    user_id: userId,
    visit_count: 1,
  });
  console.log("새로운 방문 기록 생성:", newUserActivity);
  return newUserActivity;
};

// 사용자가 가장 많이 방문한 요일 계산 함수
UserActivity.getMostVisitedDays = async function (userId) {
  // 해당 사용자의 모든 활동 기록 가져오기
  const activities = await UserActivity.findAll({
    where: { user_id: userId },
    attributes: ['createdAt'], // createdAt 필드만 가져오기
  });

  // 요일별 방문 횟수 계산
  const dayCounts = activities.reduce((counts, activity) => {
    // createdAt을 로컬 시간으로 변환
    const localTime = new Date(activity.createdAt).toLocaleString("en-US", { timeZone: "Asia/Seoul" });
    const day = new Date(localTime).toLocaleDateString("en-US", { weekday: "long" });
    counts[day] = (counts[day] || 0) + 1;
    return counts;
  }, {});

  // 최다 방문 요일 계산
  const maxVisits = Math.max(...Object.values(dayCounts)); // 가장 높은 방문 횟수
  const mostVisitedDays = Object.keys(dayCounts).filter(day => dayCounts[day] === maxVisits);

  return {
    mostVisitedDays, // 최다 방문 요일 (복수 가능)
    visitCounts: maxVisits, // 최다 방문 요일의 방문 횟수
  };
};

// 특정 요일의 방문 횟수를 계산하는 함수
UserActivity.getDayCount = async function (userId, day) {
  // 해당 사용자의 모든 활동 기록 가져오기
  const activities = await UserActivity.findAll({
    where: { user_id: userId },
    attributes: ['createdAt'], // createdAt 필드만 가져오기
  });

  // 주어진 요일 방문 횟수 계산
  return activities.reduce((count, activity) => {
    const activityDay = new Date(activity.createdAt).toLocaleDateString("en-US", { weekday: "long" });
    return activityDay === day ? count + 1 : count;
  }, 0);
};

module.exports = UserActivity;
