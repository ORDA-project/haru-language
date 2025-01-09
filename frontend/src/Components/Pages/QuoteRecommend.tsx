import React from "react";
import styled from "styled-components";

interface PopupProps {
  quote: string;
  translation: string;
  source: string;
  onClose: () => void;
}

const QuoteRecommend = ({
  quote,
  translation,
  source,
  onClose,
}: PopupProps) => {
  return (
    <PopupContainer>
      <PopupContent>
        <CloseButton onClick={onClose}>✖</CloseButton>
        <AudioIcon>🔊</AudioIcon>
        <QuoteText>{quote}</QuoteText>
        <TranslationText>{translation}</TranslationText>
        <SourceText>{source}</SourceText>
        <DownloadButton>다운로드</DownloadButton>
      </PopupContent>
    </PopupContainer>
  );
};

export default QuoteRecommend;

const PopupContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PopupContent = styled.div`
  background: linear-gradient(180deg, #fdf7e8 0%, #ffe5e5 100%);
  border-radius: 15px;
  padding: 20px;
  text-align: center;
  width: 300px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
`;

const AudioIcon = styled.div`
  font-size: 30px;
  margin-bottom: 10px;
`;

const QuoteText = styled.p`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
`;

const TranslationText = styled.p`
  font-size: 16px;
  margin-bottom: 10px;
`;

const SourceText = styled.p`
  font-size: 14px;
  color: gray;
  margin-bottom: 20px;
`;

const DownloadButton = styled.button`
  background: #f5a623;
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
`;
