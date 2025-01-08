import React, { useState } from "react";
import axios from "axios";
import NavBar from "../Templates/Navbar";
import {
  ChatBotContainer,
  MessageList,
  MessageBubble,
  InputContainer,
  TextInput,
  SendButton,
  MicButton,
} from "../../Styles/Question";
import Mike from "../../Images/mike.png"; // 마이크 이미지 import
import Send from "../../Images/sendicon.png"; // 전송 아이콘 import

const ChatBot = () => {
  const [messages, setMessages] = useState<
    { type: "user" | "bot"; content: string }[]
  >([
    {
      type: "bot",
      content: "외국 사람들도 밥 먹었냐고 안 물어봐? 비슷한 한국어가 있어?",
    },
  ]);

  const [userInput, setUserInput] = useState("");

  const handleSend = async () => {
    if (userInput.trim()) {
      setMessages((prev) => [...prev, { type: "user", content: userInput }]);

      try {
        // 백엔드로 요청 보내기
        const response = await axios.post("http://localhost:8000/question", {
          userId: 1, // userId는 고정값으로 설정하거나 동적으로 변경 가능
          question: userInput,
        });

        const botResponse = response.data.result.answer;
        setMessages((prev) => [...prev, { type: "bot", content: botResponse }]);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "서버에 연결할 수 없습니다.";
        setMessages((prev) => [
          ...prev,
          { type: "bot", content: errorMessage },
        ]);
      }

      setUserInput("");
    }
  };

  const handleMicClick = () => {
    setMessages((prev) => [
      ...prev,
      { type: "bot", content: "음성 입력 기능은 준비 중입니다!" },
    ]);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div>
      <ChatBotContainer>
        <MessageList>
          {messages.map((msg, index) => (
            <MessageBubble key={index} isUser={msg.type === "user"}>
              {msg.content}
            </MessageBubble>
          ))}
        </MessageList>
        <InputContainer>
          <MicButton onClick={handleMicClick}>
            <img src={Mike} alt="마이크" />
          </MicButton>
          <TextInput
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown} // 엔터 키 이벤트
            placeholder="내용을 입력하세요."
          />
          <SendButton onClick={handleSend}>
            <img src={Send} alt="전송" />
          </SendButton>
        </InputContainer>
      </ChatBotContainer>
      <NavBar currentPage={"Question"} />
    </div>
  );
};

export default ChatBot;
