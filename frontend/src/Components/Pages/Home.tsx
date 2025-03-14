import React, { useState, useEffect } from "react";
import styled from "styled-components";
import HomeInfo from "../Elements/HomeInfo"; // 기존 HomeInfo를 가져옵니다.
import NavBar from "../Templates/Navbar";
import HomeHeader from "../Templates/HomeHeader";
import StatusCheck from "../Elements/StatusCheck";
import axios from "axios";
// import Login from "../Pages/Login";

interface HomeProps {
  Login: boolean;
}

const Home = ({ Login = true }: HomeProps) => {
  const [userName, setUserName] = useState<string>("");
  const [visitCount, setVisitCount] = useState<number>(0);
  const [mostVisitedDay, setMostVisitedDay] = useState<string>("");
  const [recommendation, setRecommendation] = useState<string>("");

  useEffect(() => {
    axios({
      method: "GET",
      url: "http://localhost:8000/home",
      withCredentials: true,
    })
      .then((res) => {
        console.log(res.data);
        const { name, visitCount, mostVisitedDay, recommendation } =
          res.data.userData;
        console.log(name, visitCount, mostVisitedDay, recommendation);
        setUserName(name);
        setVisitCount(visitCount);
        setMostVisitedDay(mostVisitedDay);
        setRecommendation(recommendation);
      })
      .catch((err) => {
        console.error("Error fetching user data:", err);
      });
  }, []);

  return (
    <HomeContainer>
      <HomeHeader />
      <HomeDiv>
        <HomeInfo
          userName={userName}
          visitCount={visitCount}
          mostVisitedDay={mostVisitedDay}
          recommendation={recommendation}
        />
        <StatusCheck />
      </HomeDiv>
      <NavBar currentPage={"Home"} />
    </HomeContainer>
  );
};

export default Home;

const HomeContainer = styled.div`
  width: 100vw;
  height: 100vh;
`;

const HomeDiv = styled.div`
  height: calc(87vh - 100px);
  padding: 3vh 5vw;
  transform: translateY(10vh);
  overflow-y: scroll;
`;
