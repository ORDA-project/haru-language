import React, { useState, useEffect } from "react";
import styled from "styled-components";
import NavBar from "../Templates/Navbar";
import axios from "axios";

interface QuizProps {}

interface Question {
    text: string; // 질문 텍스트
    correctAnswer: "O" | "X"; // 정답 (O 또는 X)
}

const Quiz = (props: QuizProps) => {
    const [quiz, setQuiz] = useState<Question[]>([]); // 질문 목록
    const [currentIndex, setCurrentIndex] = useState(0); // 현재 문제 인덱스
    const [selectedAnswer, setSelectedAnswer] = useState<"O" | "X" | null>(null); // 선택한 답

    useEffect(() => {
        axios({
            method: "POST",
            url: "http://localhost:8000/quiz",
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
        })
            .then((res) => {
                const quizData: Question[] = res.data; // API에서 받아온 데이터를 설정
                setQuiz(quizData);
            })
            .catch((err) => console.error(err));
    }, []);

    const handleAnswer = (answer: "O" | "X") => {
        setSelectedAnswer(answer); // 선택한 답 설정
    };

    const handleNext = () => {
        setSelectedAnswer(null); // 선택한 답 초기화
        setCurrentIndex((prev) => (prev + 1 < quiz.length ? prev + 1 : prev)); // 다음 문제로 이동
    };

    if (quiz.length === 0) return <p>Loading...</p>; // 로딩 중 처리

    const currentQuestion = quiz[currentIndex]; // 현재 문제

    console.log(currentQuestion);

    return (
        <QuizContainer>
            <QuizDiv>
                <Question>
                    <p>{currentQuestion.text}</p>
                </Question>
                <OXbuttonDiv>
                    <OXButton
                        isCorrect={selectedAnswer === "O" && currentQuestion.correctAnswer === "O"}
                        isWrong={selectedAnswer === "O" && currentQuestion.correctAnswer !== "O"}
                        onClick={() => handleAnswer("O")}
                        disabled={selectedAnswer !== null}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none">
                            <circle cx="48" cy="48" r="45.2" stroke="black" strokeWidth="5.6" />
                        </svg>
                    </OXButton>
                    <OXButton
                        isCorrect={selectedAnswer === "X" && currentQuestion.correctAnswer === "X"}
                        isWrong={selectedAnswer === "X" && currentQuestion.correctAnswer !== "X"}
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
                <Button onClick={handleNext} disabled={selectedAnswer === null}>
                    다음
                </Button>
            </QuizDiv>
            <NavBar currentPage={"quiz"} />
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
    justify-content: space-between;
`;

const Question = styled.div`
    position: relative;
    width: 293px;
    padding: 20px;
    margin: 20px 10px;
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
        isCorrect ? "#A8E6A1" : isWrong ? "#F6A6A6" : "#F6F6F6"};
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

const Button = styled.button`
    border-radius: 10px;
    background: #d9d9d9;
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
