import styled from "styled-components";

export const ChatBotContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100vh;
  background-color: #f1f1f1; /* 회색 배경 */
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

  font-size: 18px; /* 글씨 크기 */
  line-height: 1.6;
  font-weight: 750; /* 글씨 두께 */

  &::after {
    content: "";
    position: absolute;
    ${({ isUser }) => (isUser ? "right: -10px;" : "left: -10px;")}
    top: 10px;
    width: 0;
    height: 0;
    border: 10px solid transparent;
    ${({ isUser }) =>
      isUser ? "border-left-color: #00daaa;" : "border-right-color: #ffffff;"}
  }
`;

export const InputContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 4px;
  background-color: #ffffff;
  border-top: 1px solid #ddd;
  position: fixed;
  bottom: 100px; /* 네비바 바로 위 */
  width: calc(100% - 10px); /* 좌우 여백 추가 */
  border-radius: 10px;
  box-shadow: 0px -2px 4px rgba(0, 0, 0, 0.1);
`;

export const TextInput = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
  margin: 0 15px;
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
  cursor: pointer;

  img {
    width: 50px;
    height: 50px;
  }

  &:hover {
    background-color: #00c89c;
  }
`;

export const MicButton = styled.button`
  background-color: #d9d9d9;
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  img {
    width: 30px;
    height: 30px;
  }

  &:hover {
    background-color: #00c89c;
  }
`;
