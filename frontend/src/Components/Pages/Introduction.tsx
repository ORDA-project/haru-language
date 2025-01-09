import React, { useState } from "react";
import {
  Stage,
  PageIndicator,
  Dot,
  Content,
  Title,
  Description,
  Placeholder,
  ImageButton,
  Icon,
  CloseButton,
} from "../../Styles/Introduction";
import rightarrow from "../../Images/rightarrow.png";
import { useNavigate } from "react-router-dom";

interface Page {
  title: string;
  description: string;
  color: string;
  buttonText?: string; // 마지막 페이지에서만 사용
}

const pages: Page[] = [
  {
    title: "교재에 없는 다양한 예문과\n정확한 발음으로\n언어 배우기",
    description: "하루 언어", // 첫 페이지만 이미지 아래 텍스트
    color: "#00DAAA",
  },
  {
    title: "예문생성",
    description:
      "버튼을 누르고 교재를 찍어보세요. 사진내용을 드래그하면 그것을 바탕으로 예문이 생성돼요.",
    color: "#00DAAA",
  },
  {
    title: "질문채팅",
    description: "질문 버튼을 누르고 AI에게 원하는 것을 물어보세요.",
    color: "#00DAAA",
  },
  {
    title: "기록과 점검",
    description:
      "나의 예문생성 기록을 다시 보고, 들을 수 있어요. 그에 대해서 쌓인 기록을 바탕으로 테스트도 할 수 있어요.",
    color: "#00DAAA",
  },
  {
    title: "하루 언어",
    description:
      "일주일의 하루씩, 언어를 공부하는 시간을 가져세요.\n하루 언어가 교재내용을 바탕으로 다양한 예문과 정확한 발음을 알려드릴게요!",
    color: "#00DAAA",
    buttonText: "하루 언어 시작하기",
  },
];

const Introduction: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const navigate = useNavigate();

  const handleNext = (): void => {
    if (currentPage < pages.length - 1) {
      setCurrentPage((prev) => prev + 1);
    } else {
      console.log("마지막 페이지: 하루 언어 시작하기 버튼 클릭");
      // 필요한 추가 로직 (예: 페이지 이동) 추가
    }
  };

  const handlePrev = (): void => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    } else {
      console.log("첫 번째 페이지입니다.");
    }
  };

  const handleClose = (): void => {
    console.log("닫기 버튼 클릭");
    navigate("/");
    // 필요한 추가 로직 (예: 페이지 닫기, 이동 등) 추가
  };

  return (
    <Stage>
      {/* 닫기 버튼 */}
      <CloseButton onClick={handleClose}>×</CloseButton>
      {/* 페이지 인디케이터 */}
      <PageIndicator>
        {pages.map((_, index) => (
          <Dot key={index} active={index === currentPage} />
        ))}
      </PageIndicator>
      {/* 페이지 콘텐츠 */}
      <Content>
        <Title>{pages[currentPage].title}</Title>
        {currentPage === 0 ? (
          <>
            <Placeholder style={{ backgroundColor: pages[currentPage].color }}>
              소개 이미지
            </Placeholder>
            <Description isFirstPage>
              {pages[currentPage].description}
            </Description>
          </>
        ) : (
          <>
            <Description>{pages[currentPage].description}</Description>
            <Placeholder style={{ backgroundColor: pages[currentPage].color }}>
              대충 이미지
            </Placeholder>
          </>
        )}
      </Content>
      {/* 왼쪽 화살표 버튼 */}
      {currentPage > 0 && (
        <ImageButton position="left" onClick={handlePrev}>
          <Icon src={rightarrow} alt="이전" flipped />
        </ImageButton>
      )}
      {/* 오른쪽 화살표 버튼 */}
      {currentPage < pages.length - 1 && (
        <ImageButton position="right" onClick={handleNext}>
          <Icon src={rightarrow} alt="다음" />
        </ImageButton>
      )}
    </Stage>
  );
};

export default Introduction;
