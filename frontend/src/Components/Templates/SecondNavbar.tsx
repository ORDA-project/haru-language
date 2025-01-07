import React from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";

import exampleIcon from "../../Images/example.png";
import homeIcon from "../../Images/home.png";
import questionIcon from "../../Images/question.png";

const NavBar = () => {
  return (
    <NavBarContainer>
      {/* 예문 버튼 */}
      <StyledNavLink to="/example">
        <IconContainer>
          <Icon src={exampleIcon} alt="예문" />
        </IconContainer>
        <span>예문</span>
      </StyledNavLink>

      {/* 둥근 홈 버튼 */}
      <StyledNavLink to="/home">
        <HomeContainer>
          <HomeIconContainer>
            <Icon src={homeIcon} alt="홈" />
          </HomeIconContainer>
          <HomeText>홈</HomeText>
        </HomeContainer>
      </StyledNavLink>

      {/* 질문 버튼 */}
      <StyledNavLink to="/question">
        <IconContainer>
          <Icon src={questionIcon} alt="질문" />
        </IconContainer>
        <span>질문</span>
      </StyledNavLink>
    </NavBarContainer>
  );
};

export default NavBar;

const NavBarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  background-color: #00daaa;
  position: fixed;
  bottom: 0;
  width: 100vw;
  height: 100px;
`;

const HomeContainer = styled.div`
  background-color: #00daaa;
  width: 80px;
  height: 80x;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: rgba(0, 0, 0, 0.5);
  font-size: 12px;
  font-weight: 500;
  height: 100%;

  &.active {
    color: white;
  }
`;

const IconContainer = styled.div`
  margin-bottom: 5px;
`;

const Icon = styled.img`
  width: 40px;
  height: 40px;
`;

const HomeIconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const HomeText = styled.span`
  margin-top: 5px;
  color: rgba(0, 0, 0, 0.5);
  font-size: 15px;
  font-weight: 500;
  text-align: center;
`;
