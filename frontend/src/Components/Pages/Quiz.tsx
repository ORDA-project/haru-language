import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // React Router로 홈 이동
import NavBar from "../Templates/Navbar";
import axios from "axios";
import { Spinner } from "basic-loading";

interface QuizProps { }

interface Question {
    question: string; // 질문 텍스트
    description: string;
    answer: "O" | "X"; // 정답 (O 또는 X)
}

const Quiz = (props: QuizProps) => {
    const [isSuccess, setSuccess] = useState<boolean>(true);
    const [message, setMessage] = useState<string>("");
    const [quiz, setQuiz] = useState<Question[]>([]); // 질문 목록
    const [currentIndex, setCurrentIndex] = useState(0); // 현재 문제 인덱스
    const [selectedAnswer, setSelectedAnswer] = useState<"O" | "X" | null>(null); // 선택한 답
    const [correctCount, setCorrectCount] = useState(0); // 맞은 문제 개수
    const [showDescription, setShowDescription] = useState(false);
    const [showPopup, setShowPopup] = useState(false); // 팝업 표시 여부
    const navigate = useNavigate(); // 페이지 이동을 위한 네비게이트

    useEffect(() => {
        axios({
            method: "POST",
            url: "http://localhost:8000/quiz",
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
        })
            .then((res) => {
                if (!res.data.success) {
                    setSuccess(false);
                    const { message } = res.data;
                    setMessage(message);
                } else {
                    const quizData: Question[] = res.data.quiz; // API에서 받아온 데이터를 설정
                    setQuiz(quizData);
                }
            })
            .catch((err) => console.error(err));
    }, []);


    const handleAnswer = (answer: "O" | "X") => {
        setSelectedAnswer(answer); // 선택한 답 설정
        if (answer === quiz[currentIndex].answer) {
            setCorrectCount((prev) => prev + 1); // 정답 개수 증가
        }

        setTimeout(() => {
            setShowDescription(true); // 1초 뒤에 설명 표시
        }, 500);
    };

    const handleNext = () => {
        if (currentIndex + 1 < quiz.length) {
            setSelectedAnswer(null); // 선택한 답 초기화
            setShowDescription(false); // 설명 초기화
            setCurrentIndex((prev) => prev + 1); // 다음 문제로 이동
        } else {
            setShowPopup(true); // 모든 문제를 푼 경우 팝업 표시
        }
    };

    const handleClosePopup = () => {
        setShowPopup(false); // 팝업 닫기
        navigate("/home"); // 홈 페이지로 이동
    };

    if (isSuccess && quiz.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#F7F8FB]">
                <div className="h-[calc(100vh-160px)] w-full max-w-[440px] box-border mx-auto flex flex-col items-center justify-center overflow-hidden">
                    <span className="text-[24px] my-[10px]">문제을 만들고 있어요.</span>
                    <span className="text-[24px] my-[10px]">잠시 기다려주세요.</span>
                    <Spinner
                        option={{
                            size: 50,
                            bgColor: "#00daaa",
                            barColor: "rgba(0, 218, 171, 0.44)",
                        }}
                    />
                </div>
                <NavBar currentPage={"quiz"} />
            </div>
        )
    }

    ; // 로딩 중 처리

    const currentQuestion = quiz[currentIndex]; // 현재 문제

    return (
        <div className="w-full h-full flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#F7F8FB]">
            {isSuccess ?
                <div className="h-[calc(100vh-160px)] w-full max-w-[440px] box-border mx-auto flex flex-col items-center justify-around overflow-y-scroll">
                    <div className="relative w-[293px] p-[20px] m-[100px_10px_10px_10px] rounded-[13px] bg-[#f6f6f6] shadow-[4px_0px_7px_2px_rgba(0,0,0,0.1)] text-start break-all after:content-[''] after:absolute after:bottom-1/2 after:right-full after:w-0 after:h-0 after:border-l-[20px] after:border-l-transparent after:border-t-[10px] after:border-t-transparent after:border-b-[10px] after:border-b-transparent after:border-r-[20px] after:border-r-[#f6f6f6]">
                        <p>{currentQuestion.question}</p>
                    </div>
                    <div className="flex flex-row">
                        <button
                            className={`w-[120px] h-[120px] rounded-[10.4px] shadow-[3.2px_0px_5.6px_1.6px_rgba(0,0,0,0.1)] flex justify-center items-center border-0 m-[20px] cursor-pointer disabled:cursor-not-allowed ${
                                selectedAnswer === "O" && currentQuestion.answer === "O" ? "bg-[#00daaa]" : 
                                selectedAnswer === "O" && currentQuestion.answer !== "O" ? "bg-[#F6A6A6]" : "bg-[#F6F6F6]"
                            }`}
                            onClick={() => handleAnswer("O")}
                            disabled={selectedAnswer !== null}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none">
                                <circle cx="48" cy="48" r="45.2" stroke="black" strokeWidth="5.6" />
                            </svg>
                        </button>
                        <button
                            className={`w-[120px] h-[120px] rounded-[10.4px] shadow-[3.2px_0px_5.6px_1.6px_rgba(0,0,0,0.1)] flex justify-center items-center border-0 m-[20px] cursor-pointer disabled:cursor-not-allowed ${
                                selectedAnswer === "X" && currentQuestion.answer === "X" ? "bg-[#00daaa]" : 
                                selectedAnswer === "X" && currentQuestion.answer !== "X" ? "bg-[#F6A6A6]" : "bg-[#F6F6F6]"
                            }`}
                            onClick={() => handleAnswer("X")}
                            disabled={selectedAnswer !== null}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 90 90" fill="none">
                                <path
                                    d="M3.39999 3.3999L86.6 86.5999"
                                    stroke="black"
                                    strokeWidth="5.91269"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M86.6 3.3999L3.4 86.5999"
                                    stroke="black"
                                    strokeWidth="5.91269"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    </div>
                    {showDescription && <div className="m-[20px] p-[10px] bg-[#f0f0f0] rounded-[8px] shadow-[2px_2px_6px_rgba(0,0,0,0.1)] text-[16px] text-center">{currentQuestion.description}</div>}
                    <button className={`rounded-[10px] w-[166px] p-[15px_0px] text-center text-[16px] border-0 m-[50px_0] cursor-pointer ${
                        selectedAnswer === null ? "bg-[#f6f6f6] cursor-not-allowed" : "bg-[#00daaa]"
                    }`} onClick={handleNext} disabled={selectedAnswer === null}>
                        다음
                    </button>
                </div>
                :
                <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white w-[250px] h-[150px] p-[20px] rounded-[10px] text-center shadow-[0px_4px_10px_rgba(0,0,0,0.2)]">
                        <p>퀴즈를 생성할 예문이 부족합니다.</p>
                        <p>예문 생성 후에 다시 시도하세요.</p>
                        <button className="mt-[20px] p-[10px_20px] bg-[#00daaa] border-none rounded-[5px] cursor-pointer hover:bg-[#c9c9c9]" onClick={handleClosePopup}>확인</button>
                    </div>
                </div>
            }
            <NavBar currentPage={"quiz"} />
            {showPopup && (
                <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white w-[250px] h-[150px] p-[20px] rounded-[10px] text-center shadow-[0px_4px_10px_rgba(0,0,0,0.2)]">
                        <p>맞은 개수: {correctCount}</p>
                        <p>틀린 개수: {quiz.length - correctCount}</p>
                        <button className="mt-[20px] p-[10px_20px] bg-[#00daaa] border-none rounded-[5px] cursor-pointer hover:bg-[#c9c9c9]" onClick={handleClosePopup}>확인</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quiz;

