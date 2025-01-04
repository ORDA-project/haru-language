// import React from "react";
// import { Example } from "../types"; // Import Example type
// import { Button, Stage, Div, Card, CardList, Context } from "../Styles/Question";

// interface StageResultProps {
//     extractedText: string;
//     examples: Example[];
//     errorMessage: string;
//     setStage: React.Dispatch<React.SetStateAction<number>>;
// }

// const StageResult = ({
//     extractedText,
//     examples,
//     errorMessage,
//     setStage,
// }: StageResultProps) => (
//         <Stage>
//             <Div>
//                 <h3>추출된 텍스트</h3>
//                 <p>{extractedText}</p>
//             </Div>
//             <Div>
//                 <h3>생성된 예문</h3>
//                 <CardList>
//                 {examples.map((example) => (
//                     <Card key={example.id}>
//                         <Context>
//                             <strong>{example.context}</strong>
//                         </Context>
//                         <p>
//                             <strong>A:</strong> {example.dialogue.A.english}
//                         </p>
//                         <p>
//                             {example.dialogue.A.korean}
//                         </p>
//                         <p>
//                             <strong>B:</strong> {example.dialogue.B.english}
//                         </p>
//                         <p>
//                             {example.dialogue.B.korean}
//                         </p>
//                     </Card>
//                 ))}
//                 </CardList>
//             </Div>
//             <Button onClick={() => setStage(1)}>다시 시작하기</Button>
//             { errorMessage && <p>{errorMessage}</p> }
//         </Stage>
// );

// export default StageResult;

import React, { useState } from "react";
import { Example } from "../types"; // Import Example type
import { Button, Stage, Card, CardList, Context, DotContainer, Dot, ButtonContainer, MoveButton, SpeakButton, Description } from "../Styles/Question";

interface StageResultProps {
    description: string;
    examples: Example[];
    errorMessage: string;
    setStage: React.Dispatch<React.SetStateAction<number>>;
}

const StageResult = ({
    description,
    examples,
    errorMessage,
    setStage,
}: StageResultProps) => {
    // currentIndex 상태 추가
    const [currentIndex, setCurrentIndex] = useState(0);

    // 다음 카드로 이동하는 함수
    const handleNextCard = () => {
        if (currentIndex < examples.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    // 이전 카드로 이동하는 함수
    const handlePreviousCard = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // 점을 클릭하여 특정 카드로 이동
    const handleDotClick = (index: number) => {
        setCurrentIndex(index);
    };

    // TTS 처리 함수
    const handleTTS = async () => {
        const textToRead = examples[currentIndex].dialogue.A.english;

        try {
            const response = await fetch("/api/tts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text: textToRead }),
            });

            if (!response.ok) {
                throw new Error("TTS 요청에 실패했습니다.");
            }

            const { audioContent } = await response.json();
            const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
            audio.play();
            console.log(audioContent);
        } catch (error) {
            console.error("TTS 오류:", error);
        }
    };


    return (
        <Stage>
            <Description>
                <p>{description}</p>
            </Description>
            <CardList>
                {examples.length > 0 && (
                    <Card key={examples[currentIndex].id}>
                        {/* 카드 인덱스를 점으로 표시 */}
                        <DotContainer>
                            {examples.map((_, index) => (
                                <Dot
                                    key={index}
                                    isActive={index === currentIndex}
                                    onClick={() => handleDotClick(index)}
                                />
                            ))}
                        </DotContainer>
                        <Context>
                            <strong>{examples[currentIndex].context}</strong>
                        </Context>
                        <p>
                            <strong>A:</strong> {examples[currentIndex].dialogue.A.english}
                        </p>
                        <p style={{ color: "grey" }}>{examples[currentIndex].dialogue.A.korean}</p>
                        <p>
                            <strong>B:</strong> {examples[currentIndex].dialogue.B.english}
                        </p>
                        <p style={{ color: "grey" }}>{examples[currentIndex].dialogue.B.korean}</p>
                        <ButtonContainer>
                            <MoveButton onClick={handlePreviousCard} disabled={currentIndex === 0}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="27" height="21" viewBox="0 0 27 21" fill="none">
                                    <path d="M25.1997 9.00039C25.9729 9.00039 26.5997 9.62719 26.5997 10.4004C26.5997 11.1736 25.9729 11.8004 25.1997 11.8004L25.1997 9.00039ZM1.10976 11.3903C0.563025 10.8436 0.563024 9.95718 1.10976 9.41044L10.0193 0.500897C10.566 -0.0458371 11.4525 -0.0458372 11.9992 0.500897C12.5459 1.04763 12.5459 1.93406 11.9992 2.4808L4.07961 10.4004L11.9992 18.32C12.5459 18.8667 12.5459 19.7532 11.9992 20.2999C11.4525 20.8466 10.566 20.8466 10.0193 20.2999L1.10976 11.3903ZM25.1997 11.8004L2.09971 11.8004L2.09971 9.00039L25.1997 9.00039L25.1997 11.8004Z" fill="black" />
                                </svg>
                            </MoveButton>
                            <SpeakButton onClick={handleTTS}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="41" height="41" viewBox="0 0 41 41" fill="none">
                                    <path d="M25.1003 7.28373C25.1003 5.48373 22.9769 4.53207 21.6336 5.7254L14.1453 12.3837C13.9167 12.5874 13.6214 12.7 13.3153 12.7004H7.18359C6.18961 12.7004 5.23629 13.095 4.53312 13.7976C3.82996 14.5001 3.43448 15.4531 3.43359 16.4471V23.9421C3.43359 24.9366 3.82868 25.8905 4.53194 26.5937C5.2352 27.297 6.18903 27.6921 7.18359 27.6921H13.3169C13.623 27.6924 13.9184 27.8051 14.1469 28.0087L21.6319 34.6637C22.9753 35.8587 25.1003 34.9054 25.1003 33.1071V7.28373ZM15.8086 14.2504L22.6003 8.2104V32.1804L15.8086 26.1421C15.1222 25.5314 14.2356 25.194 13.3169 25.1937H7.18359C6.85207 25.1937 6.53413 25.062 6.29971 24.8276C6.06529 24.5932 5.93359 24.2753 5.93359 23.9437V16.4471C5.93359 16.1155 6.06529 15.7976 6.29971 15.5632C6.53413 15.3288 6.85207 15.1971 7.18359 15.1971H13.3169C14.2354 15.1973 15.122 14.8604 15.8086 14.2504ZM31.7536 10.0287C32.0199 9.83141 32.3537 9.74794 32.6816 9.7967C33.0095 9.84546 33.3045 10.0224 33.5019 10.2887C35.6275 13.1557 36.7724 16.6314 36.7669 20.2004C36.7719 23.7696 35.6264 27.2453 33.5003 30.1121C33.4036 30.2467 33.2811 30.3608 33.14 30.4477C32.9988 30.5346 32.8418 30.5926 32.678 30.6182C32.5143 30.6438 32.347 30.6367 32.1861 30.5971C32.0251 30.5574 31.8736 30.4862 31.7405 30.3875C31.6073 30.2888 31.4951 30.1646 31.4103 30.0222C31.3256 29.8797 31.2701 29.7218 31.2469 29.5577C31.2238 29.3935 31.2336 29.2264 31.2756 29.0661C31.3177 28.9058 31.3912 28.7554 31.4919 28.6237C33.2989 26.1875 34.272 23.2336 34.2669 20.2004C34.2717 17.1678 33.2985 14.2145 31.4919 11.7787C31.394 11.6467 31.3232 11.4967 31.2833 11.3372C31.2435 11.1778 31.2355 11.012 31.2598 10.8495C31.2841 10.6869 31.3403 10.5308 31.425 10.3899C31.5097 10.2491 31.6214 10.1264 31.7536 10.0287ZM28.6719 14.1487C28.8163 14.0705 28.9746 14.0214 29.1379 14.0043C29.3012 13.9872 29.4663 14.0025 29.6237 14.0492C29.7811 14.096 29.9278 14.1733 30.0553 14.2767C30.1828 14.3801 30.2887 14.5077 30.3669 14.6521C31.2603 16.3037 31.7669 18.1937 31.7669 20.2004C31.7678 22.1368 31.2867 24.043 30.3669 25.7471C30.2888 25.8915 30.183 26.0192 30.0555 26.1227C29.928 26.2263 29.7814 26.3037 29.624 26.3506C29.4666 26.3975 29.3015 26.4129 29.1382 26.396C28.9748 26.3791 28.8164 26.3302 28.6719 26.2521C28.5275 26.1739 28.3998 26.0681 28.2963 25.9406C28.1927 25.8132 28.1153 25.6665 28.0684 25.5092C28.0215 25.3518 28.0061 25.1867 28.023 25.0233C28.0399 24.8599 28.0888 24.7015 28.1669 24.5571C28.8669 23.2621 29.2669 21.7787 29.2669 20.1987C29.2674 18.6777 28.8894 17.1805 28.1669 15.8421C28.0095 15.5505 27.9742 15.2084 28.0689 14.8909C28.1636 14.5733 28.3805 14.3064 28.6719 14.1487Z" fill="black" />
                                </svg>
                            </SpeakButton>
                            <MoveButton onClick={handleNextCard} disabled={currentIndex === examples.length - 1}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="27" height="22" viewBox="0 0 27 22" fill="none">
                                    <path d="M2.00049 9.8002C1.22729 9.8002 0.600488 10.427 0.600488 11.2002C0.600488 11.9734 1.22729 12.6002 2.00049 12.6002L2.00049 9.8002ZM26.0904 12.1901C26.6372 11.6434 26.6372 10.757 26.0904 10.2102L17.1809 1.3007C16.6342 0.753968 15.7477 0.753968 15.201 1.3007C14.6543 1.84744 14.6543 2.73387 15.201 3.2806L23.1206 11.2002L15.201 19.1198C14.6543 19.6665 14.6543 20.553 15.201 21.0997C15.7477 21.6464 16.6342 21.6464 17.1809 21.0997L26.0904 12.1901ZM2.00049 12.6002L25.1005 12.6002L25.1005 9.8002L2.00049 9.8002L2.00049 12.6002Z" fill="black" />
                                </svg>
                            </MoveButton>
                        </ButtonContainer>
                    </Card>
                )}
            </CardList>

            <Button onClick={() => setStage(1)}>다른 예문 생성하기</Button>
            {errorMessage && <p>{errorMessage}</p>}
        </Stage>
    );
};

export default StageResult;
