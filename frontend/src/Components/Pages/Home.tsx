import React, { useState, useEffect } from "react";
import styled from "styled-components";
import HomeInfoComponent from "../Elements/HomeInfo"; // 기존 HomeInfo를 가져옵니다.

interface HomeProps {}

const Home = (props: HomeProps) => {
    const [isLogin, setLogin] = useState<boolean>(true);
    


    useEffect(() => {
        setLogin(true);
        
    }, []);

    return (
        <>
            <HomeInfoComponent isLogin={isLogin} userName={"진희"} visitCount={10} />
        </>
    );
};

export default Home;

