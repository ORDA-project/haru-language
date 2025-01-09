import styled from "styled-components";

// 컨테이너 스타일
export const Stage = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: "KoPubWorldDotum_Pro", sans-serif;
  position: relative; /* 화살표 버튼 위치 고정을 위한 설정 */
  background-color: #ecfffb;
`;

// 닫기 버튼 스타일
export const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  font-size: 30px;
  color: #333;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #00daaa; /* Hover 시 색상 변경 */
  }
`;

// 페이지 인디케이터 스타일
export const PageIndicator = styled.div`
  display: flex;
  gap: 10px;
  position: absolute;
  top: 8%; /* 위치를 약간 위로 */
`;

export const Dot = styled.div<{ active: boolean }>`
  width: 12px;
  height: 12px;
  background-color: ${(props) => (props.active ? "#00DAAA" : "#ddd")};
  border-radius: 50%;
  transition: background-color 0.3s;
`;

// 콘텐츠 스타일
export const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center; /* 이미지와 버튼 중앙 정렬 */
  gap: 15px;
  width: 90%;
  margin-bottom: 120px;
`;

// 타이틀 스타일
export const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  line-height: 170%;
  text-align: left;
  color: #000;
  white-space: pre-wrap;
  width: 90%;
  margin-left: 10px;
  margin-top: 100px;
`;

// 설명 텍스트 스타일
export const Description = styled.p<{ isFirstPage?: boolean }>`
  font-size: ${(props) => (props.isFirstPage ? "25px" : "20px")};
  font-weight: ${(props) => (props.isFirstPage ? "700" : "500")};
  line-height: 170%;
  color: #000;
  text-align: ${(props) => (props.isFirstPage ? "center" : "left")};
  width: ${(props) => (props.isFirstPage ? "100%" : "90%")};
  margin-top: ${(props) => (props.isFirstPage ? "20px" : "10px")};
`;

// 이미지 자리 스타일
export const Placeholder = styled.div`
  width: 325px;
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: white;
  font-weight: bold;
  border-radius: 10px;
`;

// 화살표 버튼 스타일
export const ImageButton = styled.button<{ position: "left" | "right" }>`
  position: absolute;
  bottom: 50px;
  ${(props) => (props.position === "left" ? "left: 20px;" : "right: 20px;")}
  width: 60px;
  height: 60px;
  background-color: #d9d9d9;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background-color: #c8c8c8;
  }
`;

// 화살표 아이콘 스타일
export const Icon = styled.img<{ flipped?: boolean }>`
  width: 30px;
  height: 30px;
  transform: ${(props) => (props.flipped ? "scaleX(-1)" : "none")};
`;
