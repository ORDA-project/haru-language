const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const { getTodayStringBy4AM, hashDateString } = require('../utils/dateUtils');

// 여러 경로 시도 (개발/프로덕션 환경 대응)
const possiblePaths = [
  path.join(__dirname, '../seeders/songs.csv'), // 기본 경로
  path.join(process.cwd(), 'seeders/songs.csv'), // 현재 작업 디렉토리 기준
  path.join(process.cwd(), 'backend/seeders/songs.csv'), // 루트에서 실행 시
];

// CSV 파일 경로 찾기 함수
const findCsvPath = () => {
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }
  return possiblePaths[0]; // 기본 경로 반환 (에러는 나중에 처리)
};

const getRandomSong = (req) => {
  return new Promise((resolve, reject) => {
    // CSV 파일 경로 찾기
    const actualPath = findCsvPath();

    if (!fs.existsSync(actualPath)) {
      const errorMsg = `노래 데이터 파일을 찾을 수 없습니다. 시도한 경로: ${possiblePaths.join(', ')}`;
      console.error('[songService]', errorMsg);
      return reject(new Error(errorMsg));
    }

    const songs = [];

    fs.createReadStream(actualPath)
      .pipe(csvParser())
      .on('data', (row) => {
        songs.push(row);
      })
      .on('end', () => {
        if (songs.length === 0) {
          const errorMsg = `노래 데이터가 비어있습니다. 경로: ${actualPath}`;
          console.error('[songService]', errorMsg);
          return reject(new Error(errorMsg));
        }

        // 오전 4시 기준으로 오늘 날짜 문자열 가져오기
        const todayString = getTodayStringBy4AM();
        // 날짜 문자열을 해시하여 노래 인덱스 결정 (같은 날에는 같은 노래)
        const hash = hashDateString(todayString);
        const songIndex = hash % songs.length;
        const selectedSong = songs[songIndex];

        const songData = {
          Artist: selectedSong.Artist || '정보 없음',
          Title: selectedSong.Title || '정보 없음',
          Lyric: selectedSong.Lyric || '가사 없음',
          YouTube: selectedSong.YouTube || '',        // 원본 필드명 유지
          youtubeLink: selectedSong.YouTube || '',    // songYoutubeRoute에서 사용하는 필드명
        };

        req.session.songData = songData;
        resolve(songData);
      })
      .on('error', (error) => {
        const errorMsg = `CSV 읽기 실패: ${error.message}. 경로: ${actualPath}`;
        console.error('[songService]', errorMsg, error);
        reject(new Error(errorMsg));
      });
  });
};

module.exports = { getRandomSong };
