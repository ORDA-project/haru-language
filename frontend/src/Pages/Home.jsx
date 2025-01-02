import React from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";

import { useState } from "react";

const Home = () => {
    const [isLogin, setLogin] = useState(true);


    return (
        <>
        <Notice>
            {
            isLogin ? 
            <>
            <p>진희님, 반가워요.</p>
            <p>오늘로 벌써 13번째 방문하셨어요</p>
            </> :
            <>
            <p>로그인</p>
            </>
            }
        </Notice>

        </>
    )
}



const Notice = styled.div`
    width: 100vw;
`;

export default Home;
