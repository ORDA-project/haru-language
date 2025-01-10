const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

const csvFolderPath = path.join(__dirname, '../seeders/csv');

// 랜덤 가수 선택 및 랜덤 노래 반환
const getRandomSong = (req) => {
  return new Promise((resolve, reject) => {
    // 1. CSV 파일 목록 가져오기
    fs.readdir(csvFolderPath, (err, files) => {
      if (err) {
        return reject('CSV 폴더 읽기 실패: ' + err.message);
      }

      const csvFiles = files.filter((file) => file.endsWith('.csv'));
      if (csvFiles.length === 0) {
        return reject('CSV 파일이 없습니다.');
      }

      // 2. 랜덤 가수(CSV 파일) 선택
      const randomCsvFile = csvFiles[Math.floor(Math.random() * csvFiles.length)];
      const randomCsvPath = path.join(csvFolderPath, randomCsvFile);

      // 3. CSV 파일 읽기
      const songs = [];
      fs.createReadStream(randomCsvPath)
        .pipe(csvParser())
        .on('data', (row) => {
          songs.push(row);
        })
        .on('end', () => {
          if (songs.length === 0) {
            return reject('노래 데이터가 없습니다.');
          }

          // 4. 랜덤 노래 선택
          const randomSong = songs[Math.floor(Math.random() * songs.length)];
          const songData = {
            Artist: randomCsvFile.replace('.csv', ''), // 파일 이름에서 가수명 추출
            Title: randomSong.Title || '정보 없음',
            Lyric: randomSong.Lyric || '가사 없음',
          };

          // 세션에 저장
          req.session.songData = songData;

          resolve(songData);
        })
        .on('error', (error) => {
          reject('CSV 읽기 실패: ' + error.message);
        });
    });
  });
};

module.exports = { getRandomSong };