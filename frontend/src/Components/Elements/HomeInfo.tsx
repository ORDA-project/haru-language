import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import download from "../../Images/download.png";
import speaker from "../../Images/speaker.png";

interface HomeInfoProps {
  userName?: string;
  visitCount?: number;
  mostVisitedDay?: string;
  recommendation?: string;
}

const HomeInfo = ({
  userName,
  visitCount,
  mostVisitedDay,
  recommendation,
}: HomeInfoProps) => {
  const navigate = useNavigate();

  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const openPopup = () => setIsPopupVisible(true);
  const closePopup = () => setIsPopupVisible(false);

  const quoteData = {
    quote:
      "The only limit to our realization of tomorrow is our doubts of today.",
    translation: "내일 실현의 유일한 한계는 오늘의 의심이다.",
    source: "Franklin D. Roosevelt",
  };

  useEffect(() => {
    if (isPopupVisible) {
      document.body.style.overflow = "hidden"; // 스크롤 비활성화
    } else {
      document.body.style.overflow = "auto"; // 스크롤 복원
    }

    return () => {
      document.body.style.overflow = "auto"; // 컴포넌트 언마운트 시 스크롤 복원
    };
  }, [isPopupVisible]);

  return (
    <>
      <div>
        <Text>
          <span>{userName}</span>님, 반가워요.
          <br />
          오늘로 벌써 <StyledSpan>3번째</StyledSpan> 방문하셨어요.
        </Text>
      </div>
      <Alarm>
        <div>
          <div
            style={{ fontSize: "16px", fontWeight: 700, lineHeight: "150%" }}
          >
            {mostVisitedDay} 알람 바로가기
          </div>
          <div style={{ fontSize: "11px", lineHeight: "150%" }}>
            <span>
              {userName}님은 하루언어를
              <br /> {mostVisitedDay}금요일에 자주 이용하시는군요!
            </span>
          </div>
        </div>
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="17"
            viewBox="0 0 22 17"
            fill="none"
          >
            <path
              d="M2 7.4C1.39249 7.4 0.9 7.89249 0.9 8.5C0.9 9.10751 1.39249 9.6 2 9.6V7.4ZM20.7778 9.27782C21.2074 8.84824 21.2074 8.15176 20.7778 7.72218L13.7775 0.721825C13.3479 0.292249 12.6514 0.292249 12.2218 0.721825C11.7922 1.1514 11.7922 1.84788 12.2218 2.27746L18.4444 8.5L12.2218 14.7225C11.7922 15.1521 11.7922 15.8486 12.2218 16.2782C12.6514 16.7078 13.3479 16.7078 13.7775 16.2782L20.7778 9.27782ZM2 9.6H20V7.4H2V9.6Z"
              fill="black"
              fill-opacity="0.6"
            />
          </svg>
        </div>
      </Alarm>
      <Quote onClick={openPopup}>
        <div style={{ width: "180px" }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              lineHeight: "150%",
              margin: "20px 0",
            }}
          >
            <span>오늘의 추천 명언</span>
          </div>
          <Content>
            <span>"The only limit to our realization of... of today."</span>
          </Content>
        </div>
        <Icon>
          <div style={{ top: "0", left: "-50px" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="80"
              height="70"
              viewBox="0 0 80 70"
              fill="none"
            >
              <path
                d="M31.77 14.27C24.835 21.2 21.73 28.07 20.57 36.03C22.5186 35.0671 24.7278 34.7654 26.8632 35.1703C28.9986 35.5753 30.9439 36.6649 32.4047 38.2743C33.8655 39.8837 34.7621 41.9252 34.9589 44.0898C35.1557 46.2543 34.6419 48.424 33.4954 50.2705C32.3488 52.1169 30.6319 53.5396 28.6045 54.323C26.5771 55.1064 24.3497 55.208 22.2595 54.6124C20.1692 54.0167 18.3299 52.7563 17.02 51.0218C15.7102 49.2874 15.001 47.1735 15 45C15.005 32.04 17.64 21.33 28.235 10.73C28.7044 10.2606 29.3411 9.99684 30.005 9.99684C30.6689 9.99684 31.3056 10.2606 31.775 10.73C32.2444 11.1994 32.5081 11.8361 32.5081 12.5C32.5081 13.1639 32.2394 13.8006 31.77 14.27ZM61.775 14.27C54.84 21.2 51.73 28.07 50.575 36.03C52.524 35.0683 54.7332 34.7677 56.8683 35.1738C59.0034 35.5798 60.948 36.6704 62.4079 38.2804C63.8678 39.8903 64.7635 41.9321 64.9593 44.0966C65.1551 46.2611 64.6405 48.4305 63.4932 50.2764C62.346 52.1222 60.6286 53.5441 58.6011 54.3268C56.5736 55.1094 54.3463 55.2102 52.2563 54.6139C50.1664 54.0176 48.3276 52.7567 47.0183 51.022C45.709 49.2873 45.0005 47.1733 45 45C45.005 32.04 47.64 21.33 58.235 10.73C58.7044 10.2606 59.3411 9.99684 60.005 9.99684C60.6689 9.99684 61.3056 10.2606 61.775 10.73C62.2444 11.1994 62.5081 11.8361 62.5081 12.5C62.5081 13.1639 62.2444 13.8006 61.775 14.27Z"
                fill="#FFA6A8"
              />
            </svg>
          </div>
          <div style={{ top: "-40px", left: "20px" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
            >
              <path
                d="M48.23 55.73C55.165 48.8 58.27 41.93 59.43 33.97C57.4814 34.9329 55.2722 35.2346 53.1368 34.8297C51.0014 34.4247 49.0561 33.3351 47.5953 31.7257C46.1345 30.1163 45.2379 28.0748 45.0411 25.9102C44.8443 23.7457 45.3581 21.576 46.5046 19.7295C47.6512 17.8831 49.3681 16.4604 51.3955 15.677C53.4229 14.8936 55.6503 14.792 57.7405 15.3876C59.8308 15.9833 61.6701 17.2437 62.98 18.9782C64.2898 20.7126 64.999 22.8265 65 25C64.995 37.96 62.36 48.67 51.765 59.27C51.2956 59.7394 50.6589 60.0032 49.995 60.0032C49.3311 60.0032 48.6944 59.7394 48.225 59.27C47.7556 58.8006 47.4919 58.1639 47.4919 57.5C47.4919 56.8361 47.7606 56.1994 48.23 55.73ZM18.225 55.73C25.16 48.8 28.27 41.93 29.425 33.97C27.476 34.9317 25.2668 35.2323 23.1317 34.8262C20.9966 34.4202 19.052 33.3296 17.5921 31.7196C16.1322 30.1097 15.2365 28.0679 15.0407 25.9034C14.8449 23.7389 15.3595 21.5695 16.5068 19.7236C17.654 17.8778 19.3714 16.4559 21.3989 15.6732C23.4264 14.8906 25.6537 14.7898 27.7437 15.3861C29.8336 15.9824 31.6724 17.2433 32.9817 18.978C34.291 20.7127 34.9995 22.8267 35 25C34.995 37.96 32.36 48.67 21.765 59.27C21.2956 59.7394 20.6589 60.0032 19.995 60.0032C19.3311 60.0032 18.6944 59.7394 18.225 59.27C17.7556 58.8006 17.4919 58.1639 17.4919 57.5C17.4919 56.8361 17.7556 56.1994 18.225 55.73Z"
                fill="#FCC21B"
              />
            </svg>
          </div>
        </Icon>
      </Quote>
      {isPopupVisible && (
        <PopupOverlay onClick={closePopup}>
          <PopupContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={closePopup}>X</CloseButton>
            <SpeakerIcon>
              <img src={speaker} alt="Speaker Icon" />
            </SpeakerIcon>
            <QuoteText>{quoteData.quote}</QuoteText>
            <Translation>{quoteData.translation}</Translation>
            <Source>{quoteData.source}</Source>
            <DownloadButton>
              <img src={download} alt="Download Icon" />
              다운로드
            </DownloadButton>
          </PopupContent>
        </PopupOverlay>
      )}

      <SongRecommend
        onClick={() => {
          navigate("/song-recommend");
        }}
      >
        <div style={{ width: "180px" }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              lineHeight: "150%",
              margin: "20px 0",
            }}
          >
            <span>오늘의 추천 팝송</span>
          </div>
          <Content>
            <span>{recommendation}</span>
          </Content>
        </div>
        <Icon>
          <div style={{ top: "10px", left: "-60px" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="63"
              height="63"
              viewBox="0 0 63 63"
              fill="none"
            >
              <path
                d="M31.5 13.125V35.5687C29.0325 34.1512 25.9875 33.6 22.7587 34.7287C19.2412 35.9887 16.5375 39.1125 15.9075 42.7875C15.6162 44.4411 15.7251 46.1404 16.225 47.7433C16.7248 49.3462 17.6011 50.8062 18.7807 52.0012C19.9602 53.1961 21.4087 54.0913 23.005 54.6119C24.6013 55.1326 26.299 55.2635 27.9562 54.9937C33.1012 54.18 36.75 49.455 36.75 44.2312V18.375H42C44.8875 18.375 47.25 16.0125 47.25 13.125C47.25 10.2375 44.8875 7.875 42 7.875H36.75C33.8625 7.875 31.5 10.2375 31.5 13.125Z"
                fill="#FEB1DA"
              />
            </svg>
          </div>
          <div style={{ top: "-20px", left: "-25px" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="53"
              height="53"
              viewBox="0 0 53 53"
              fill="none"
              style={{}}
            >
              <path
                d="M10.75 50.125C15.0992 50.125 18.625 46.5992 18.625 42.25C18.625 37.9008 15.0992 34.375 10.75 34.375C6.40076 34.375 2.875 37.9008 2.875 42.25C2.875 46.5992 6.40076 50.125 10.75 50.125Z"
                fill="#CAE85D"
                stroke="#CAE85D"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M42.25 47.5C46.5992 47.5 50.125 43.9742 50.125 39.625C50.125 35.2758 46.5992 31.75 42.25 31.75C37.9008 31.75 34.375 35.2758 34.375 39.625C34.375 43.9742 37.9008 47.5 42.25 47.5Z"
                fill="#CAE85D"
                stroke="#CAE85D"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M50.125 2.875L18.625 10.75V21.25L50.125 13.375V2.875Z"
                fill="#CAE85D"
              />
              <path
                d="M18.625 42.25V21.25M18.625 21.25V10.75L50.125 2.875V13.375M18.625 21.25L50.125 13.375M50.125 39.625V13.375"
                stroke="#CAE85D"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <div style={{ top: "-100px", left: "20px" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="63"
              height="63"
              viewBox="0 0 63 63"
              fill="none"
            >
              <path
                d="M31.5 13.125V35.5687C29.0325 34.1512 25.9875 33.6 22.7587 34.7287C19.2412 35.9887 16.5375 39.1125 15.9075 42.7875C15.6162 44.4411 15.7251 46.1404 16.225 47.7433C16.7248 49.3462 17.6011 50.8062 18.7807 52.0012C19.9602 53.1961 21.4087 54.0913 23.005 54.6119C24.6013 55.1326 26.299 55.2635 27.9562 54.9937C33.1012 54.18 36.75 49.455 36.75 44.2312V18.375H42C44.8875 18.375 47.25 16.0125 47.25 13.125C47.25 10.2375 44.8875 7.875 42 7.875H36.75C33.8625 7.875 31.5 10.2375 31.5 13.125Z"
                fill="#FF6363"
              />
            </svg>
          </div>
        </Icon>
      </SongRecommend>
      <StudyStatus>
        <div
          style={{ display: "flex", flexDirection: "column", width: "100%" }}
        >
          <div
            style={{ fontSize: "20px", fontWeight: 700, lineHeight: "150%" }}
          >
            7번 남았어요!
          </div>
          <div style={{ fontSize: "14px", lineHeight: "150%" }}>
            <span>
              7번 더 오면 시즌 2를
              <br />
              완료할 수 있어요.
            </span>
          </div>
        </div>
        <div style={{ height: "100%" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="104"
            height="95"
            viewBox="0 0 104 95"
            fill="none"
          >
            <path
              d="M72.2222 -9H31.7778C30.2454 -9 28.7758 -8.39127 27.6923 -7.30773C26.6087 -6.22418 26 -4.75458 26 -3.22222V28.5556C26 28.5556 26 31.4444 28.8889 34.3333L47.4616 48.7778H56.5384L75.1111 34.3333C78 31.4444 78 28.5556 78 28.5556V-3.22222C78 -4.75458 77.3913 -6.22418 76.3077 -7.30773C75.2242 -8.39127 73.7546 -9 72.2222 -9Z"
              fill="#55ACEE"
            />
            <path
              d="M34.6667 -9V38.8256L47.4615 48.7778H56.5384L69.3333 38.8256V-9H34.6667Z"
              fill="#E1E8ED"
            />
            <path
              d="M40.4445 -9V43.3207L47.4616 48.7778H56.5385L63.5556 43.3207V-9H40.4445Z"
              fill="#DD2E44"
            />
            <path
              d="M63.2724 51.7245C63.4551 51.2445 63.5509 50.7358 63.5555 50.2222C63.5555 49.073 63.099 47.9708 62.2863 47.1581C61.4737 46.3455 60.3715 45.8889 59.2222 45.8889H44.7778C43.6285 45.8889 42.5263 46.3455 41.7136 47.1581C40.901 47.9708 40.4444 49.073 40.4444 50.2222C40.4444 50.7509 40.5542 51.2536 40.7276 51.7245C37.1374 53.7269 34.1472 56.6517 32.0659 60.1967C29.9847 63.7417 28.8879 67.7781 28.8889 71.8889C28.8889 78.0184 31.3238 83.8968 35.658 88.2309C39.9921 92.5651 45.8705 95 52 95C58.1294 95 64.0078 92.5651 68.342 88.2309C72.6762 83.8968 75.1111 78.0184 75.1111 71.8889C75.1111 63.2222 70.3329 55.6794 63.2724 51.7245Z"
              fill="#FFAC33"
            />
            <path
              d="M52 89.2222C61.5729 89.2222 69.3333 81.4618 69.3333 71.8889C69.3333 62.3159 61.5729 54.5555 52 54.5555C42.4271 54.5555 34.6667 62.3159 34.6667 71.8889C34.6667 81.4618 42.4271 89.2222 52 89.2222Z"
              fill="#FFD983"
            />
            <path
              d="M59.8896 84.4845C59.5388 84.481 59.1973 84.3712 58.9102 84.1696L52 79.2122L45.0869 84.1696C44.8009 84.3762 44.457 84.4872 44.1041 84.4868C43.7513 84.4865 43.4076 84.3748 43.122 84.1676C42.8364 83.9605 42.6235 83.6684 42.5136 83.3332C42.4037 82.9979 42.4024 82.6365 42.51 82.3005L45.0869 73.9805L38.2373 69.1531C37.9549 68.9431 37.7455 68.6498 37.6387 68.3145C37.5318 67.9792 37.5328 67.6188 37.6416 67.2841C37.7504 66.9495 37.9615 66.6573 38.2451 66.449C38.5287 66.2406 38.8706 66.1265 39.2225 66.1227L47.7071 66.1111L50.4082 57.9962C50.5184 57.661 50.7316 57.3691 51.0175 57.1622C51.3033 56.9553 51.6471 56.8439 52 56.8439C52.3529 56.8439 52.6967 56.9553 52.9826 57.1622C53.2684 57.3691 53.4816 57.661 53.5918 57.9962L56.2467 66.1111L64.7747 66.1227C65.1284 66.1228 65.4729 66.2349 65.7591 66.4428C66.0452 66.6507 66.2581 66.9439 66.3675 67.2802C66.4768 67.6166 66.4769 67.9789 66.3678 68.3154C66.2586 68.6518 66.0458 68.945 65.7598 69.1531L58.9102 73.9805L61.4871 82.3005C61.5671 82.5517 61.5867 82.8183 61.5443 83.0785C61.5019 83.3388 61.3986 83.5853 61.2429 83.7981C61.0873 84.011 60.8836 84.184 60.6484 84.3033C60.4132 84.4225 60.1532 84.4846 59.8896 84.4845Z"
              fill="#FFAC33"
            />
          </svg>
        </div>
      </StudyStatus>
      <hr style={{ strokeWidth: "0.5px", stroke: "#B4B2B3" }} />
    </>
  );
};

export default HomeInfo;

const Div = styled.div``;

const Text = styled.p`
  font-size: 24px;
  line-height: 150%;
  font-weight: 500;
  margin: 20px 0;
`;

const Content = styled.div`
  font-size: 22px;
  font-weight: 700;
  line-height: 150%;
  width: max-content;
  max-width: 50vw;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 20px 0;
  line-height: 22px;
  max-height: 44px;
`;

const StyledSpan = styled.span`
  font-weight: 700;
`;

const Alarm = styled.div`
  display: flex;
  padding: 10px 20px;
  justify-content: space-between;
  align-items: center;
  border-radius: 20px;
  background: #d2deed;
  box-shadow: 0px 3px 7px 2px rgba(0, 0, 0, 0.05);
  margin: 20px 0;
`;

const Quote = styled.div`
  height: 120px;
  display: flex;
  padding: 0 20px;
  justify-content: space-between;
  align-items: center;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0px 3px 7px 2px rgba(0, 0, 0, 0.05);
  margin: 20px 0;
`;

const QuoteIcon = styled.div``;

const SongRecommend = styled.div`
  height: 120px;
  display: flex;
  padding: 0 20px;
  justify-content: space-between;
  align-items: center;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0px 3px 7px 2px rgba(0, 0, 0, 0.05);
  margin: 20px 0;
`;

const Icon = styled.div`
  height: 120px;

  & div {
    position: relative;
  }
`;

const StudyStatus = styled.div`
  height: 120px;
  display: flex;
  padding: 0 20px;
  justify-content: space-between;
  align-items: center;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0px 3px 7px 2px rgba(0, 0, 0, 0.05);
  margin: 20px 0;
`;
const PopupOverlay = styled.div`
  position: fixed; /* 화면 전체를 덮도록 고정 */
  top: 0;
  left: 0;
  width: 100%; /* 화면 전체 너비 */
  height: 100%; /* 화면 전체 높이 */
  background: rgba(0, 0, 0, 0.5); /* 반투명 검정 배경 */
  display: flex;
  justify-content: center; /* 팝업을 수평 중앙에 배치 */
  align-items: center; /* 팝업을 수직 중앙에 배치 */
  z-index: 1000; /* 다른 요소 위에 표시 */
`;

const PopupContent = styled.div`
  background: linear-gradient(180deg, #fff0a7, #90eed9);
  padding: 20px 30px;
  border-radius: 20px;
  width: 300px;
  text-align: center;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.25);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  font-weight: bold;
  color: #333;

  &:hover {
    color: #ff0000;
  }
`;

const SpeakerIcon = styled.div`
  margin: 0 auto 10px;
  width: 51px;
  height: 51px;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const QuoteText = styled.p`
  font-size: 18px;
  font-weight: 700;
  margin: 10px 0;
  color: #333;
`;

const Translation = styled.p`
  font-size: 14px;
  margin: 5px 0 15px;
  color: #555;
`;

const Source = styled.p`
  font-size: 12px;
  color: #888;
  margin-bottom: 20px;
`;

const DownloadButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center; /* 오른쪽으로 정렬 */
  gap: 8px; /* 아이콘과 텍스트 간격 */
  background: transparent;
  border: none;
  font-size: 14px;
  color: #333;
  font-weight: 600;
  cursor: pointer;
  width: 100%; /* 버튼이 전체 너비를 차지하도록 설정 */

  img {
    width: 20px; /* 아이콘 크기 조정 */
    height: 20px;
  }

  &:hover {
    color: #007bff;
  }
`;
