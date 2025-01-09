import styled from "styled-components";

export const Stage = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly; /* 위/아래 간격 균등 분배 */
  align-items: center;
  font-family: "KoPubWorldDotum_Pro", sans-serif;
  background-color: #ecfffb;
  text-align: center;
`;

export const TopContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 100px; /* 상단 여백 추가 */
  margin-bottom: 10px; /* 하단 여백 감소 */
`;

export const BottomContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px; /* 버튼 간의 간격 */
  margin-top: 10px; /* 상단 여백 감소 */
`;

// 로고 이미지 스타일
export const Logo = styled.img`
  width: 120px;
  height: auto;
  margin-bottom: 20px;
  margin-left: 17px;
  animation: fadeIn 1s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// 제목 스타일
export const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #333;
`;

// 둘러보기 텍스트 스타일
export const Subtitle = styled.p`
  font-size: 16px;
  font-weight: 500;
  color: #004f4f;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.3s ease;

  &:hover {
    color: #008c68; /* Hover 색상 */
  }
`;

// 구글 로그인 버튼 스타일
export const LoginButton = styled.button`
  width: 300px;
  height: 50px;
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #f8f8f8;
    transform: scale(1.05); /* 버튼 Hover 시 확대 효과 */
  }

  &:active {
    transform: scale(0.95); /* 클릭 시 살짝 축소 효과 */
  }
`;

// 구글 로고 스타일
export const GoogleLogo = styled.img`
  width: 24px;
  height: 24px;
`;

// 카카오 로그인 버튼 스타일
export const KakaoLoginButton = styled(LoginButton)`
  background-color: #fee500;
  color: #3c1e1e;

  &:hover {
    background-color: #fdd835; /* Hover 시 약간 어두운 노란색 */
  }
`;

export const KakaoLogo = styled.img`
  width: 24px;
  height: 24px;
`;
