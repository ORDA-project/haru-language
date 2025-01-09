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
  imageUrl: string; // 이미지 URL 추가
  buttonText?: string; // 마지막 페이지에서만 사용
}

const pages: Page[] = [
  {
    title: "교재에 없는 다양한 예문과\n정확한 발음으로\n언어 배우기",
    description: "하루 언어",
    color: "#00DAAA",
    imageUrl:
      "https://media.discordapp.net/attachments/1313845567851466772/1327001845637447812/image.png?ex=67817a46&is=678028c6&hm=533672786e5629edd7b895da5153f0375a6e8b31233797c5755060aafd8d914d&=&format=webp&quality=lossless&width=438&height=495",
  },
  {
    title: "예문생성",
    description:
      "버튼을 누르고 교재를 찍어보세요. 사진내용을 드래그하면 그것을 바탕으로 예문이 생성돼요.",
    color: "#00DAAA",
    imageUrl:
      "https://media.discordapp.net/attachments/1313845567851466772/1327003661355978823/image.png?ex=67817bf7&is=67802a77&hm=a305c16c35ee9362f8ab1c9672add5fe8d106aca2c3c0bd101284e1b67d70bff&=&format=webp&quality=lossless&width=321&height=337",
  },
  {
    title: "질문채팅",
    description: "질문 버튼을 누르고 AI에게 원하는 것을 물어보세요.",
    color: "#00DAAA",
    imageUrl:
      "https://media.discordapp.net/attachments/1313845567851466772/1327002159082111038/image.png?ex=67817a91&is=67802911&hm=ebcb7c3e366787631f9b99aa7a18208ae17cade05e2b0cd8cfdb06a3cc3d868c&=&format=webp&quality=lossless&width=268&height=293",
  },
  {
    title: "기록과 점검",
    description:
      "나의 예문생성 기록을 다시 보고, 들을 수 있어요. 그에 대해서 쌓인 기록을 바탕으로 테스트도 할 수 있어요.",
    color: "#00DAAA",
    imageUrl:
      "https://media.discordapp.net/attachments/1313845567851466772/1327002448832761857/image.png?ex=67817ad6&is=67802956&hm=9681278e9538a3853c6cd70b09a6089765dab740fe78dab99b91ed596d36853c&=&format=webp&quality=lossless&width=207&height=243",
  },
  {
    title: "하루 언어",
    description:
      "일주일의 하루씩, 언어를 공부하는 시간을 가져세요.\n하루 언어가 교재내용을 바탕으로 다양한 예문과 정확한 발음을 알려드릴게요!",
    color: "#00DAAA",
    imageUrl:
      "https://media.discordapp.net/attachments/1313845567851466772/1327003082206220368/image.png?ex=67817b6d&is=678029ed&hm=af35ec9e5766ebae3c61c5d437ae0b8a700e2a7d5459bd7c1793d25b8457cdd8&=&format=webp&quality=lossless&width=272&height=295",
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
      navigate("/start"); // 페이지 이동 추가
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
        <Description isFirstPage={currentPage === 0}>
          {pages[currentPage].description}
        </Description>
        <Placeholder style={{ backgroundColor: pages[currentPage].color }}>
          <img
            src={pages[currentPage].imageUrl}
            alt="페이지 이미지"
            style={{ width: "100%", height: "100%", borderRadius: "10px" }}
          />
        </Placeholder>
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
