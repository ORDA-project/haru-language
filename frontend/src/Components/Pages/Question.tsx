import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { API_ENDPOINTS } from "../../config/api";
import NavBar from "../Templates/Navbar";
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
        const response = await axios.get(API_ENDPOINTS.home, {
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
          url: API_ENDPOINTS.question,
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
    <div className="w-full h-full flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#F7F8FB]">
      <div className="h-[calc(100vh-80px)] w-full max-w-[440px] box-border mx-auto flex flex-col justify-end bg-gray-100">
        <div className="flex items-center justify-center mb-5 pt-2">
          <label className="text-base font-bold mr-2">폰트 크기</label>
          <div className="flex gap-2">
            <button 
              onClick={() => handleFontSizeChange(14)}
              className="px-3 py-2 text-sm border border-gray-300 rounded bg-white shadow-sm hover:bg-gray-50 active:bg-gray-200 active:shadow-inner cursor-pointer"
            >
              작게
            </button>
            <button 
              onClick={() => handleFontSizeChange(18)}
              className="px-3 py-2 text-sm border border-gray-300 rounded bg-white shadow-sm hover:bg-gray-50 active:bg-gray-200 active:shadow-inner cursor-pointer"
            >
              중간
            </button>
            <button 
              onClick={() => handleFontSizeChange(22)}
              className="px-3 py-2 text-sm border border-gray-300 rounded bg-white shadow-sm hover:bg-gray-50 active:bg-gray-200 active:shadow-inner cursor-pointer"
            >
              크게
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-[70%] p-4 my-1 rounded-lg relative shadow-md font-bold leading-relaxed ${
                msg.type === "user"
                  ? "bg-teal-400 text-white self-end"
                  : "bg-white text-gray-800 self-start"
              } ${
                msg.type === "user"
                  ? "after:content-[''] after:absolute after:top-2 after:-right-2 after:border-l-[10px] after:border-l-teal-400 after:border-t-[10px] after:border-t-transparent after:border-b-[10px] after:border-b-transparent"
                  : "after:content-[''] after:absolute after:top-2 after:-left-2 after:border-r-[10px] after:border-r-white after:border-t-[10px] after:border-t-transparent after:border-b-[10px] after:border-b-transparent"
              }`}
              style={{ fontSize: `${fontSize}px` }}
            >
              {msg.type === "bot" ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center p-1 bg-white border-t border-gray-300 w-full box-border shadow-inner">
          <button 
            onClick={handleMicClick}
            className="bg-gray-400 text-white border-none rounded-full w-10 h-10 flex justify-center items-center cursor-pointer hover:bg-teal-500"
          >
            <img src={Mike} alt="마이크" className="w-7 h-7" />
          </button>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="내용을 입력하세요."
            className="flex-1 p-2 border border-gray-300 rounded-full mx-4 text-base"
          />
          <button 
            onClick={handleSend}
            className="bg-teal-400 text-white border-none rounded-full w-12 h-12 flex justify-center items-center cursor-pointer hover:bg-teal-500"
          >
            <img src={Send} alt="전송" className="ml-0.5 w-12 h-12" />
          </button>
        </div>
      </div>
      <NavBar currentPage={"Question"} />
    </div>
  );
};

export default ChatBot;
