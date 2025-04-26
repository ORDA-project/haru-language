import React from 'react';
import styled from 'styled-components';

interface CheckIconsProps {
  checkNum: number;
}

const CheckIcons: React.FC<CheckIconsProps> = ({ checkNum }) => {
  return (
    <CheckDiv>
      {Array.from({ length: checkNum }, (_, index) => (
        <svg style={{margin: "7px"}} key={index} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#00DAAA" />
          <path
            d="M5.59961 12.3201L10.8509 16.8001L18.3996 7.20007"
            stroke="black"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </CheckDiv>
  );
};

const CheckDiv = styled.div`
  margin: 0 7px;
  display: flex;
  align-items: center;
`;

export default CheckIcons;
