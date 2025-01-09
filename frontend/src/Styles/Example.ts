import styled, { keyframes } from "styled-components";

export const Stage = styled.div`
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
`;



export const Description = styled.div`
    position: relative;
    width: 293px;
    padding: 20px;
    margin: 10px;
    border-radius: 13px;
    background: #F6F6F6;
    box-shadow: 4px 0px 7px 2px rgba(0, 0, 0, 0.10);
    text-align: start;

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


export const CardList = styled.div`
    display: flex;
    overflow: auto;
    justify-content: center;
`;

export const Card = styled.div`
    width: 293px;
    padding: 20px;
    margin: 10px;
    border-radius: 13px;
    background: #F6F6F6;
    box-shadow: 4px 0px 7px 2px rgba(0, 0, 0, 0.10);
    flex-shrink: 0;
    text-align: start;
`;

export const ButtonContainer = styled.div`
    display: flex; 
    justify-content: space-between;
`;

export const MoveButton = styled.button`
    border: none;
    background-color: rgba(0, 0, 0, 0);
    transform: translateY(15px);

    &:disabled {
        opacity: 0;
    }
`;

export const SpeakButton = styled.button`
    border-radius: 40px;
    background: #00DAAA;
    width: 80px;
    height: 80px;
    border: none;

    &:active{
        background:rgba(0, 218, 171, 0.45);
    }
    &:focus{
        background:rgba(0, 218, 171, 0.45);
    }
`;

export const Label = styled.label`
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #ffffff;
    margin: 20px;
`;

export const Text = styled.p`
  font-size: 24px;
  color: #333
`;

export const Span = styled.span`
    font-size: 24px;
    margin: 10px 0;
`;

export const Button = styled.button`
  padding: 20px;
  background-color: #00daaa;
  font-size: 19px;
  font-weight: 700;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px;
`;

export const Result = styled.div`
  text-align: center;
`;

export const Heading = styled.h3`
  margin-top: 20px;
  font-size: 24px;
  color: #333;
`;

export const ExampleCard = styled.div`
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
`;

export const Error = styled.p`
  color: red;
  margin-top: 20px;
  font-size: 16px;
`;

export const ProgressBar = styled.div`
    width: 80%;
  background-color: #e0e0e0;
  margin: 20px auto;
  border-radius: 5px;
  overflow: hidden;
`;

export const Context = styled.strong`
    background-color: #00daaa;
`;

export const DotContainer = styled.div`
    display: flex;
    justify-content: center;
    margin: 10px 0;
    transform: translateY(-10px);
`;

export const Dot = styled.div<{ isActive: boolean }>`
    width: 10px;
    height: 10px;
    margin: 0 5px;
    border-radius: 50%;
    background-color: ${({ isActive }) => (isActive ? "#00daaa" : "gray")};
    cursor: pointer;

    &:hover {
        background-color: #00daaa;
    }
`;
