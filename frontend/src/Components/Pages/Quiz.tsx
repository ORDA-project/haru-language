import React, { useState, useEffect } from "react";
import styled from "styled-components";
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

            <Stage>
                <Span>문제을 만들고 있어요.</Span>
                <Span>잠시 기다려주세요.</Span>
                <Spinner
                    option={{
                        size: 50,
                        bgColor: "#00daaa",
                        barColor: "rgba(0, 218, 171, 0.44)",
                    }}
                />
            </Stage>

        )
    }

    ; // 로딩 중 처리

    const currentQuestion = quiz[currentIndex]; // 현재 문제

    return (
        <QuizContainer>
            {isSuccess ?
                <QuizDiv>
                    <Question>
                        <p>{currentQuestion.question}</p>
                    </Question>
                    <OXbuttonDiv>
                        <OXButton
                            isCorrect={selectedAnswer === "O" && currentQuestion.answer === "O"}
                            isWrong={selectedAnswer === "O" && currentQuestion.answer !== "O"}
                            onClick={() => handleAnswer("O")}
                            disabled={selectedAnswer !== null}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none">
                                <circle cx="48" cy="48" r="45.2" stroke="black" strokeWidth="5.6" />
                            </svg>
                        </OXButton>
                        <OXButton
                            isCorrect={selectedAnswer === "X" && currentQuestion.answer === "X"}
                            isWrong={selectedAnswer === "X" && currentQuestion.answer !== "X"}
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
                        </OXButton>
                    </OXbuttonDiv>
                    {showDescription && <Description>{currentQuestion.description}</Description>}
                    <Button onClick={handleNext} disabled={selectedAnswer === null}>
                        다음
                    </Button>
                </QuizDiv>
                :
                <Popup>
                    <PopupContent>
                        <p>퀴즈를 생성할 예문이 부족합니다.</p>
                        <p>예문 생성 후에 다시 시도하세요.</p>
                        <CloseButton onClick={handleClosePopup}>확인</CloseButton>
                    </PopupContent>
                </Popup>
            }
            <NavBar currentPage={"quiz"} />
            {showPopup && (
                <Popup>
                    <PopupContent>
                        <p>맞은 개수: {correctCount}</p>
                        <p>틀린 개수: {quiz.length - correctCount}</p>
                        <CloseButton onClick={handleClosePopup}>확인</CloseButton>
                    </PopupContent>
                </Popup>
            )}
        </QuizContainer>
    );
};

export default Quiz;

const QuizContainer = styled.div`
    width: 100vw;
    height: 100vh;
`;

const QuizDiv = styled.div`
    width: 100vw;
    height: calc(100vh - 100px);
    position: fixed;
    top: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
`;

const Question = styled.div`
    position: relative;
    width: 293px;
    padding: 20px;
    margin: 100px 10px 10px 10px;
    border-radius: 13px;
    background: #f6f6f6;
    box-shadow: 4px 0px 7px 2px rgba(0, 0, 0, 0.1);
    text-align: start;
    word-break: break-all;

    &::after {
        content: "";
        position: absolute;
        bottom: 50%;
        right: 100%;
        width: 0;
        height: 0;
        border-left: 20px solid transparent;
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;
        border-right: 20px solid #f6f6f6;
    }
`;

const OXbuttonDiv = styled.div`
    display: flex;
    flex-direction: row;
`;

const OXButton = styled.button<{ isCorrect: boolean; isWrong: boolean }>`
    width: 120px;
    height: 120px;
    border-radius: 10.4px;
    background: ${({ isCorrect, isWrong }) =>
        isCorrect ? "#00daaa" : isWrong ? "#F6A6A6" : "#F6F6F6"};
    box-shadow: 3.2px 0px 5.6px 1.6px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: center;
    align-items: center;
    border: 0;
    margin: 20px;
    cursor: pointer;

    &:disabled {
        cursor: not-allowed;
    }
`;

const Description = styled.div`
    margin: 20px;
    padding: 10px;
    background: #f0f0f0;
    border-radius: 8px;
    box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.1);
    font-size: 16px;
    text-align: center;
`;

const Button = styled.button`
    border-radius: 10px;
    background: #00daaa;
    width: 166px;
    padding: 15px 0px;
    text-align: center;
    font-size: 16px;
    border: 0;
    margin: 50px 0;
    cursor: pointer;

    &:disabled {
        background: #f6f6f6;
        cursor: not-allowed;
    }
`;

const Popup = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
`;

const PopupContent = styled.div`
    background: white;
    width: 250px;
    height: 150px;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
`;

const CloseButton = styled.button`
    margin-top: 20px;
    padding: 10px 20px;
    background: #00daaa;
    border: none;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
        background: #c9c9c9;
    }
`;

const Span = styled.span`
    font-size: 24px;
    margin: 10px 0;
`;

const Stage = styled.div`
    width: 100vw;
    height: calc(100vh - 100px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
`;