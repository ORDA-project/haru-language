import styled from "styled-components";
import { useNavigate } from "react-router-dom";

interface StatusProps {}

const StatusCheck = (props: StatusProps) => {

    const navigate = useNavigate();

  const progressRecords = [
    {
      date: "09/30",
      content: (
        <>
          What do you do?
          <br />
          ‘너는 무슨 일을 하니?’
          <br />
          🔥<strong>주요 단어:</strong> incredible (굉장한)
        </>
      ),
    },
    {
      date: "09/24",
      content: (
        <>
          How do you feel today?
          <br />
          ‘오늘 기분 어때?’
          <br />
          🔥<strong>주요 표현:</strong> I feel incredible. (정말 기분이 좋다)
        </>
      ),
    },
    {
      date: "09/18",
      content: (
        <>
          I have been working for a year.
          <br />
          ‘나는 일을 시작한 지 벌써 1년이 되었어.’
          <br />
          🔥<strong>주요 표현:</strong> for a year (1년 동안), 벌써 (already)
        </>
      ),
    },
    {
      date: "09/17",
      content: (
        <>
          08/29~09/10 진도 점검: 복습
          <br />
          🔥<strong>주요 단어:</strong> progress (진전), review (복습)
        </>
      ),
    },
    {
      date: "09/10",
      content: (
        <>
          My hobby is drinking tea.
          <br />
          ‘내 취미는 차 마시기야.’
          <br />
          🔥<strong>주요 단어:</strong> hobby (취미), drinking (마시는 것)
        </>
      ),
    },
    {
      date: "09/05",
      content: (
        <>
          Do you like sweets?
          <br />
          ‘너 단 거 좋아해?’
          <br />
          🔥<strong>주요 표현:</strong> I like bitter chocolate. (나는 쓴
          초콜릿을 좋아해.)
        </>
      ),
    },
    {
      date: "08/29",
      content: (
        <>
          What's popular these days?
          <br />
          ‘요즘 유행하는 건 뭐야?’
          <br />
          🔥<strong>주요 단어:</strong> popular (인기 있는), these days (요즘)
        </>
      ),
    },
  ];

  return (
    <StatusContainer>
      {/* <Button onClick={() => {navigate("/quiz");}}>진도 점검 하러 가기</Button> */}
      <StatusRecord>
        <RecordTitle>지난 시간에는 이런 걸 배웠어요📝</RecordTitle>
        {progressRecords.map((record, index) => (
          <RecordItem key={index}>
            <Date>{record.date}</Date>
            <Content>{record.content}</Content>
          </RecordItem>
        ))}
      </StatusRecord>
    </StatusContainer>
  );
};

export default StatusCheck;

// 스타일 컴포넌트
const StatusContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const Button = styled.button`
  border-radius: 20px;
  border: 0;
  background: #fcc21b;
  box-shadow: 0px 3px 7px 2px rgba(0, 0, 0, 0.05);
  width: 95%;
  padding: 21px 17px;
  font-size: 19px;
  font-weight: 700;
  line-height: 150%;
  margin: 25px;
`;

const StatusRecord = styled.div`
  border-radius: 10px;
  background: #d2deed;
  width: 90%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 15px;
  box-shadow: 0px 3px 7px rgba(0, 0, 0, 0.1);
  margin: 10px;
`;

const RecordTitle = styled.div`
  font-size: 19px;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
  width: 100%;
`;

const RecordItem = styled.div`
  min-height: 70px;
  display: flex;
  align-items: flex-start;
  padding: 12px 15px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
  width: 91%;
  height: 100px; /* 박스 크기 고정 */
  overflow: hidden; /* 넘치는 내용 숨기기 */
`;

const Date = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: #666;
  width: 60px;
  margin-right: 10px;
`;

const Content = styled.div`
  font-size: 18px;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 4; /* 최대 3줄까지만 표시 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis; /* 넘치는 내용 ... 처리 */

  strong {
    font-weight: bold;
  }
`;
