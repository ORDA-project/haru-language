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
  FontSizeContainer,
  FontSizeLabel,
  FontSizeButton,
} from "../../Styles/Question";
import Mike from "../../Images/mike.png";
import Send from "../../Images/sendicon.png";

const ChatBot = () => {
  const [messages, setMessages] = useState<
    { type: "user" | "bot"; content: string }[]
  >([]);
  const [userInput, setUserInput] = useState("");
  const [fontSize, setFontSize] = useState(18); // 기본 폰트 크기
  const [userName, setUserName] = useState("사용자");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Home 페이지와 동일한 API 요청
        const response = await axios.get("http://localhost:8000/home", {
          withCredentials: true, // 쿠키 포함
        });

        console.log("Response data:", response.data);

        // 사용자 이름 가져오기
        const fetchedUserName = response.data.userData?.name || "사용자";
        setUserName(fetchedUserName);

        // 초기 메시지 설정
        setMessages([
          {
            type: "bot",
            content: `안녕하세요, ${fetchedUserName}님! 학습 관련 도움이 필요하신가요?😊`,
          },
        ]);
      } catch (error: any) {
        console.error("사용자 데이터를 불러오는 데 실패했습니다:", error);
        setMessages([
          {
            type: "bot",
            content: "안녕하세요! 학습 관련 도움이 필요하신가요?",
          },
        ]);
      }
    };

    fetchUserData();
  }, []);

  const handleSend = async () => {
    if (userInput.trim()) {
      const currentInput = userInput;
      setUserInput("");
      setMessages((prev) => [...prev, { type: "user", content: currentInput }]);

      try {
        axios({
          method: "POST",
          url: "http://localhost:8000/question",
          data: { question: currentInput },
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        })
          .then((res) => {
            const botResponse = res.data.answer.answer;
            console.log(botResponse);
            setMessages((prev) => [
              ...prev,
              { type: "bot", content: botResponse },
            ]);
          })
          .catch((error) => {
            console.log(error);
          });
      } catch (error: any) {
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

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
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
        <FontSizeContainer>
          <FontSizeLabel>폰트 크기</FontSizeLabel>
          <div style={{ display: "flex", gap: "10px" }}>
            <FontSizeButton onClick={() => handleFontSizeChange(14)}>
              작게
            </FontSizeButton>
            <FontSizeButton onClick={() => handleFontSizeChange(18)}>
              중간
            </FontSizeButton>
            <FontSizeButton onClick={() => handleFontSizeChange(22)}>
              크게
            </FontSizeButton>
          </div>
        </FontSizeContainer>
        <MessageList>
          {messages.map((msg, index) => (
            <MessageBubble
              key={index}
              isUser={msg.type === "user"}
              fontSize={fontSize}
            >
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
