import { useState } from "react";
import styled from "styled-components";
import NavBar from "../Templates/Navbar";

interface RecommendProps {

}

const SongRecommend = (props: RecommendProps) => {


    return (
        <RecommendContainer>
            {/* 뒤로가기 버튼 */}
            <div style={{position: "fixed", margin: "40px 30px"}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
                    <path d="M14.2969 23.4375L5.85938 15L14.2969 6.5625M7.03125 15H24.1406" stroke="black" stroke-width="2.8125" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </div>
            <RecommendDiv>
                <Youtube>

                </Youtube>
                <Lyrics>

                </Lyrics>
            </RecommendDiv>
            <NavBar currentPage={"Home"} />
        </RecommendContainer>
    );
}

const RecommendContainer = styled.div`
    width: 100vw;
    height: 100vh;
`;

const RecommendDiv = styled.div`
    display: flex;
    flex-direction: column;
`;

const Youtube = styled.div`

`;

const Lyrics = styled.div`

`;

export default SongRecommend;