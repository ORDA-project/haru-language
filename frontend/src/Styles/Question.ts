import styled from "styled-components";

export const ChatBotContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100vh;
  background-color: #f9f9f9;
  padding-bottom: 130px; /* 네비바 높이만큼 패딩 추가 */
`;

export const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const MessageBubble = styled.div<{ isUser: boolean }>`
  max-width: 70%;
  padding: 15px;
  margin: 5px 0;
  border-radius: 15px;
  background-color: ${({ isUser }) => (isUser ? "#00daaa" : "#ffffff")};
  color: ${({ isUser }) => (isUser ? "#ffffff" : "#333")};
  align-self: ${({ isUser }) => (isUser ? "flex-end" : "flex-start")};
  position: relative;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);

    /* 글꼴 스타일 */
  font-size: 18px; /* 글씨 크기 증가 */
  line-height: 1.6; /* 줄 간격 확대 */
  font-weight: 750; /* 더 두껍게 */


  &::after {
    content: "";
    position: absolute;
    ${({ isUser }) => (isUser ? "right: -10px;" : "left: -10px;")}
    top: 10px;
    width: 0;
    height: 0;
    border: 10px solid transparent;
    border- ${({ isUser }) => (isUser ? "left-color" : "right-color")}: 
      ${({ isUser }) => (isUser ? "#00daaa" : "#ffffff")};
  }
`;

export const InputContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #ffffff;
  border-top: 1px solid #ddd;
  position: fixed;
  bottom: 100px; /* 네비바 바로 위 */
  width: calc(100% - 20px); /* 좌우 여백 추가 */
  border-radius: 10px;
  box-shadow: 0px -2px 4px rgba(0, 0, 0, 0.1); /* 그림자 추가 */
`;

export const TextInput = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
  margin-right: 15px;
  font-size: 16px;
`;

export const SendButton = styled.button`
  background-color: #00daaa;
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  cursor: pointer;
  margin-right: 10px;

  &:hover {
    background-color: #00c89c;
  }
`;

export const MicButton = styled.button`
  background-color: #00daaa;
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  cursor: pointer;

  img {
    width: 24px;
    height: 24px;
  }

  &:hover {
    background-color: #00c89c;
  }
`;
