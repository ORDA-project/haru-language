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
  line-height: 170%; /* 37.4px */
  text-align: left; /* 글씨 왼쪽 정렬 */
  color: #000;
  white-space: pre-wrap;
  width: 90%; /* 글씨의 최대 너비 조정 */
  margin-left: 10px; /* 약간 오른쪽으로 이동 */
  margin-top: 100px; /* Dot과의 간격 */
`;

// 설명 텍스트 스타일
export const Description = styled.p<{ isFirstPage?: boolean }>`
  font-size: ${(props) => (props.isFirstPage ? "25px" : "20px")};
  font-weight: ${(props) => (props.isFirstPage ? "700" : "500")};
  line-height: 170%; /* 첫 페이지와 나머지 간격 동일 */
  color: #000;
  text-align: ${(props) =>
    props.isFirstPage ? "center" : "left"}; /* 첫 페이지에서만 중앙 정렬 */
  width: ${(props) =>
    props.isFirstPage ? "100%" : "90%"}; /* 첫 페이지에서만 너비 확장 */
  margin-top: ${(props) =>
    props.isFirstPage ? "20px" : "10px"}; /* 간격 조정 */
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

// 오른쪽 화살표 버튼 스타일
export const ImageButton = styled.button`
  position: absolute; /* 위치 고정 */
  bottom: 50px; /* 아래에서 50px */
  right: calc(50% - 45px); /* 화면 중앙에 고정 */
  width: 90px;
  height: 90px;
  background-color: #d9d9d9; /* 어두운 버튼 배경 */
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background-color: #d9d9d9; /* hover 상태에서도 동일한 색 */
  }
`;

export const Icon = styled.img`
  width: 40px;
  height: 40px;
`;
