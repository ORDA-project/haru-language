import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import download from "../../Images/download.png";
import speaker from "../../Images/speaker.png";

interface HomeInfoProps {
  userName?: string;
  visitCount?: number;
  mostVisitedDay?: string;
  recommendation?: string;
  isLoggedIn?: boolean;
}

const HomeInfo = ({
  userName,
  visitCount,
  mostVisitedDay,
  recommendation,
  isLoggedIn,
}: HomeInfoProps) => {
  const navigate = useNavigate();

  const [isPopupVisible, setIsPopupVisible] = useState(false);

  // const openPopup = () => setIsPopupVisible(true);
  // const closePopup = () => setIsPopupVisible(false);

  // const quoteData = {
  //   quote:
  //     "The only limit to our realization of tomorrow is our doubts of today.",
  //   translation: "내일 실현의 유일한 한계는 오늘의 의심이다.",
  //   source: "Franklin D. Roosevelt",
  // };

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
      {isLoggedIn ? (
        <div>
          <p className="text-[24px] leading-[150%] font-medium my-[20px]">
            <span>{userName}</span>님, 반가워요.
            <br />
            오늘로 벌써 <span className="font-bold">{visitCount}번째</span>{" "}
            방문하셨어요.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-start justify-center gap-1 my-2">
          <div className="text-[24px] leading-[150%] font-medium">
            로그인이 필요합니다.
          </div>
          <Link
            to="/"
            className="text-[16px] leading-[150%] font-medium underline-offset-4 underline"
          >
            로그인 및 회원가입
          </Link>
        </div>
      )}
      <div className="h-[200px] flex flex-col justify-start items-start p-[20px] rounded-[20px] bg-white shadow-[0px_3px_7px_2px_rgba(0,0,0,0.05)] my-[20px] border-4 border-[#00DAAA]">
        <div className="text-[16px] font-bold leading-[150%] bg-[#00E8B6]">
          <span>오늘의 한줄 영어</span>
        </div>
        <div className="text-[22px] font-bold leading-[150%] w-full overflow-hidden text-ellipsis my-[20px] max-h-[90px] flex flex-col">
          <div>Have you ever played a game?</div>
          <div>게임을 해 본 적이 있어?</div>
        </div>

        <div className="w-full flex flex-col items-end">
          <div className="rounded-[70px] bg-gradient-to-r from-transparent to-[#00DAAA] w-1/2 h-[50px] flex justify-end items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="27"
              height="22"
              viewBox="0 0 27 22"
              fill="none"
              className="-translate-x-[15px]"
            >
              <path
                d="M2 9.40005C1.2268 9.40005 0.6 10.0269 0.6 10.8C0.6 11.5732 1.2268 12.2 2 12.2L2 9.40005ZM26.0899 11.79C26.6367 11.2433 26.6367 10.3568 26.0899 9.8101L17.1804 0.900555C16.6337 0.353821 15.7472 0.353821 15.2005 0.900555C14.6538 1.44729 14.6538 2.33372 15.2005 2.88045L23.1201 10.8001L15.2005 18.7196C14.6538 19.2664 14.6538 20.1528 15.2005 20.6995C15.7472 21.2463 16.6337 21.2463 17.1804 20.6995L26.0899 11.79ZM2 12.2L25.1 12.2001L25.1 9.40005L2 9.40005L2 12.2Z"
                fill="black"
              />
            </svg>
          </div>
        </div>
      </div>
      <div
        className="h-[120px] flex px-5 py-2 justify-between items-center rounded-[20px] bg-white shadow-[0px_3px_7px_2px_rgba(0,0,0,0.05)] cursor-pointer"
        onClick={() => {
          navigate("/song-recommend");
        }}
      >
        <div className="w-full">
          <div className="text-[16px] font-bold leading-[150%]">
            <span>오늘의 추천 팝송</span>
          </div>
          <div className="text-xl font-bold max-w-4/5 text-ellipsis">
            <span>{recommendation}</span>
          </div>
        </div>
        <div className="h-[120px]">
          <div className="relative top-[10px] left-[-60px]">
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
          <div className="relative top-[-20px] left-[-25px]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="53"
              height="53"
              viewBox="0 0 53 53"
              fill="none"
            >
              <path
                d="M10.75 50.125C15.0992 50.125 18.625 46.5992 18.625 42.25C18.625 37.9008 15.0992 34.375 10.75 34.375C6.40076 34.375 2.875 37.9008 2.875 42.25C2.875 46.5992 6.40076 50.125 10.75 50.125Z"
                fill="#CAE85D"
                stroke="#CAE85D"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M42.25 47.5C46.5992 47.5 50.125 43.9742 50.125 39.625C50.125 35.2758 46.5992 31.75 42.25 31.75C37.9008 31.75 34.375 35.2758 34.375 39.625C34.375 43.9742 37.9008 47.5 42.25 47.5Z"
                fill="#CAE85D"
                stroke="#CAE85D"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M50.125 2.875L18.625 10.75V21.25L50.125 13.375V2.875Z"
                fill="#CAE85D"
              />
              <path
                d="M18.625 42.25V21.25M18.625 21.25V10.75L50.125 2.875V13.375M18.625 21.25L50.125 13.375M50.125 39.625V13.375"
                stroke="#CAE85D"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="relative top-[-100px] left-[20px]">
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
        </div>
      </div>
      <div className="h-[120px] flex p-[0_20px] justify-between items-center rounded-[20px] bg-white shadow-[0px_3px_7px_2px_rgba(0,0,0,0.05)] my-[20px]">
        <div className="flex flex-col w-full">
          <div className="text-[20px] font-bold leading-[150%]">
            7번 남았어요!
          </div>
          <div className="text-[14px] leading-[150%]">
            <span>
              7번 더 오면 시즌 2를
              <br />
              완료할 수 있어요.
            </span>
          </div>
        </div>
        <div className="h-full">
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
      </div>
      <hr className="border-t border-[#B4B2B3]" />
    </>
  );
};

export default HomeInfo;
