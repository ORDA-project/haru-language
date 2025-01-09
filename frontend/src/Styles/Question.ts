// 스타일 코드
import styled from "styled-components";

export const ChatBotContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100vh;
  background-color: #f1f1f1;
  padding-bottom: 130px;
`;

export const FontSizeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  padding-top: 10px;
`;

export const FontSizeLabel = styled.label`
  font-size: 16px;
  font-weight: bold;
  margin-right: 10px;
`;

export const FontSizeButton = styled.button`
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 5px;
  cursor: pointer;
  background-color: #ffffff;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #f8f8f8;
  }

  &:active {
    background-color: #e0e0e0;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

export const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const MessageBubble = styled.div<{ isUser: boolean; fontSize: number }>`
  max-width: 70%;
  padding: 15px;
  margin: 5px 0;
  border-radius: 10px;
  background-color: ${({ isUser }) => (isUser ? "#00daaa" : "#ffffff")};
  color: ${({ isUser }) => (isUser ? "#ffffff" : "#333")};
  align-self: ${({ isUser }) => (isUser ? "flex-end" : "flex-start")};
  position: relative;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);

  font-size: ${({ fontSize }) => fontSize}px;
  line-height: 1.6;
  font-weight: 750;

  &::after {
    content: "";
    position: absolute;
    top: 10px; /* 조정 가능 */
    ${({ isUser }) =>
      isUser
        ? "right: -8px; border-left: 10px solid #00daaa;"
        : "left: -8px; border-right: 10px solid #ffffff;"}
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
  }
`;

export const InputContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 4px;
  background-color: #ffffff;
  border-top: 1px solid #ddd;
  position: fixed;
  bottom: 100px;
  width: calc(100% - 10px);
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
    margin-left: 2px;
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
  width: 40px;
  height: 40px;
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
