import React, { useState, useEffect } from "react";
import styled from "styled-components";

interface HomeInfoProps {
    isLogin: boolean;
    userName?: string;
    visitCount?: number;
}

const HomeInfo = ({ isLogin, userName, visitCount }: HomeInfoProps) => {
    return (
        <>
        <StyledDiv>
            {isLogin ? (
                <>
                    <p>
                        <span>{userName}</span>님, 반가워요.
                    </p>
                    <p>
                        오늘로 벌써 <StyledSpan>{visitCount}번째</StyledSpan> 방문하셨어요.
                    </p>
                </>
            ) : (
                <>
                    <p>로그인 후 이용 가능합니다.</p>
                </>
            )}
        </StyledDiv>
        <Alarm>
            
        </Alarm>
        </>
    );
};

export default HomeInfo;

const StyledDiv = styled.div`
    text-align: flex-start;
    margin: 20px;
    font-size: 22px;
`;

const StyledSpan = styled.span`
    font-weight: 700;
`;

const Alarm = styled.div`

`;