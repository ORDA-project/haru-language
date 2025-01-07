import React, { useState, useEffect } from "react";
import styled from "styled-components";
import HomeInfo from "../Elements/HomeInfo"; // 기존 HomeInfo를 가져옵니다.
import NavBar from "../Templates/Navbar";
import HomeHeader from "../Elements/HomeHeader";
// import Login from "../Pages/Login";

interface HomeProps {
    Login: boolean;
}

const Home = ({Login = true}: HomeProps) => {
    const [isLogin, setLogin] = useState<boolean>(true);

    useEffect(() => {
        setLogin(Login);
        
    }, []);

    return (
        <HomeContainer>
            {isLogin ? (
                <HomeDiv>
                    <HomeHeader />
                    <HomeInfo userName={"진희"} visitCount={10} mostVisitedDay={"월요일"} recommendation={"Santa Tell Me by Ariana Grande"}/>
                </HomeDiv>
            ) : (
                <div>로그인 후 이용 가능</div>
            )}
            <NavBar currentPage={"Home"}/>
        </HomeContainer>
    );
};

export default Home;

const HomeContainer = styled.div`
    width: 100vw;
    height: 100vh;
`;

const HomeDiv = styled.div`
    padding: 5vw;
`;
