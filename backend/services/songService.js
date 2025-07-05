const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

const csvFilePath = path.join(__dirname, '../seeders/songs.csv'); // 파일 하나만 사용

const getRandomSong = (req) => {
  return new Promise((resolve, reject) => {
    const songs = [];

    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on('data', (row) => {
        songs.push(row);
      })
      .on('end', () => {
        if (songs.length === 0) {
          return reject('노래 데이터가 없습니다.');
        }

        const randomSong = songs[Math.floor(Math.random() * songs.length)];

        const songData = {
          Artist: randomSong.Artist || '정보 없음',
          Title: randomSong.Title || '정보 없음',
          Lyric: randomSong.Lyric || '가사 없음',   // 여기만 주의
          YouTube: randomSong.YouTube || '',        // 링크도 같이 쓰고 싶다면
        };

        req.session.songData = songData;
        resolve(songData);
      })
      .on('error', (error) => {
        reject('CSV 읽기 실패: ' + error.message);
      });
  });
};

module.exports = { getRandomSong };
