import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
import Mike from "../../Images/mike.png";
import Send from "../../Images/sendicon.png";

const ChatBot = () => {
  const [messages, setMessages] = useState<
    { type: "user" | "bot"; content: string }[]
  >([]);
  const [userInput, setUserInput] = useState("");
  const [userName, setUserName] = useState("사용자"); // 기본값: "사용자"

  // 사용자 이름 가져오기 (백엔드 호출 예제)
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const response = await axios.get("http://localhost:8000/user"); // 예: 사용자 정보 API
        setUserName(response.data.name || "사용자");
        setMessages([
          {
            type: "bot",
            content: `안녕하세요, ${
              response.data.userData?.name || "사용자"
            }님! 학습 관련 도움이 필요하신가요?`,
          },
        ]);
      } catch (error) {
        console.error("사용자 이름을 불러오는 데 실패했습니다.", error);
        setMessages([
          {
            type: "bot",
            content: "안녕하세요! 학습 관련 도움이 필요하신가요?",
          },
        ]);
      }
    };

    fetchUserName();
  }, []);

  const handleSend = async () => {
    if (userInput.trim()) {
      // 입력값을 즉시 비우기
      const currentInput = userInput;
      setUserInput("");

      // 사용자가 입력한 메시지 추가
      setMessages((prev) => [...prev, { type: "user", content: currentInput }]);

      try {
        console.log("Sending request to backend...");
        const response = await axios.post("http://localhost:8000/question", {
          userId: 1,
          question: currentInput,
        });
        console.log("Response from backend:", response.data);

        const botResponse = response.data.answer.answer;
        setMessages((prev) => [...prev, { type: "bot", content: botResponse }]);
      } catch (error) {
        console.error("Error during request:", error);
        const errorMessage =
          error.response?.data?.message || "서버에 연결할 수 없습니다.";
        setMessages((prev) => [
          ...prev,
          { type: "bot", content: errorMessage },
        ]);
      }
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
              {msg.type === "bot" ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
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
            onKeyDown={handleKeyDown}
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
