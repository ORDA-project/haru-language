import React from "react"
import { useState } from "react"
import styled from "styled-components";
import NavBar from "../Templates/Navbar";

interface QuizProps {

}

const Quiz = (props: QuizProps) => {
    return (
        <QuizContainer>
            <QuizDiv>
                <Question>
                    <p>
                        
                    </p>
                </Question>
                <OXbuttonDiv>
                    <OXButton>
                        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none">
                            <circle cx="48" cy="48" r="45.2" stroke="black" stroke-width="5.6" />
                        </svg>
                    </OXButton>
                    <OXButton>
                        <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 90 90" fill="none">
                            <path d="M3.39999 3.3999L86.6 86.5999" stroke="black" stroke-width="5.91269" stroke-linecap="round" />
                            <path d="M86.6 3.3999L3.4 86.5999" stroke="black" stroke-width="5.91269" stroke-linecap="round" />
                        </svg>
                    </OXButton>
                </OXbuttonDiv>
                <Button>
                    다음
                </Button>
            </QuizDiv>
            <NavBar currentPage={"quiz"} />
        </QuizContainer>
    );
}

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
    margin: 100px 10px;
    border-radius: 13px;
    background: #F6F6F6;
    box-shadow: 4px 0px 7px 2px rgba(0, 0, 0, 0.10);
    text-align: start;
    word-break: break-all;

    /* 말풍선의 '꼬리' 부분 */
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
        border-right: 20px solid #F6F6F6;
    }
`;

const OXbuttonDiv = styled.div`
    display: flex;
    flex-direction: row;
`;

const OXButton = styled.button`
    width: 120px;
    height: 120px;
    border-radius: 10.4px;
    background: #F6F6F6;
    box-shadow: 3.2px 0px 5.6px 1.6px rgba(0, 0, 0, 0.10);
    display: flex;
    justify-content: center;
    align-items: center;
    border: 0;
    margin: 20px;
`;

const Button = styled.button`
    border-radius: 10px;
    background: #D9D9D9;
    width: 166px;
    padding: 15px 0px;
    text-align: center;
    font-size: 16px;
    border: 0;
    margin: 50px 0;
`;


