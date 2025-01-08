import React, { useState } from "react";
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

  const handleSend = () => {
    if (userInput.trim()) {
      setMessages((prev) => [...prev, { type: "user", content: userInput }]);

      const botResponse = generateBotResponse(userInput);
      setMessages((prev) => [...prev, { type: "bot", content: botResponse }]);

      setUserInput("");
    }
  };

  const handleMicClick = () => {
    setMessages((prev) => [
      ...prev,
      { type: "bot", content: "음성 입력 기능은 준비 중입니다!" },
    ]);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  const generateBotResponse = (input: string) => {
    if (input.includes("밥")) {
      return "Did you eat lunch? 영어권에서는 친구나 가족끼리 주로 사용하는 질문입니다.";
    }
    return "질문에 대해 아직 학습 중이에요!";
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
          <TextInput
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress} // 엔터 키 이벤트 추가
            placeholder="내용을 입력하세요."
          />
          <SendButton onClick={handleSend}>전송</SendButton>
          <MicButton onClick={handleMicClick}>
            <img src={Mike} alt="마이크" />
          </MicButton>
        </InputContainer>
      </ChatBotContainer>
      <NavBar currentPage={"Question"} />
    </div>
  );
};

export default ChatBot;
