import React from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";

interface NavBarProps {
  currentPage: string;
}

const NavBar = ({ currentPage }: NavBarProps) => {
  return (
    <NavBarContainer>
      {/* 예문 버튼 */}
      <StyledNavLink to="/example">
        <IconContainer>
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 34 34" fill="none">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.90283 8.09524C4.93848 8.09524 4.01362 8.47051 3.33172 9.1385C2.64981 9.80648 2.26672 10.7125 2.26672 11.6571V25.9048C2.26672 26.8494 2.64981 27.7554 3.33172 28.4234C4.01362 29.0914 4.93848 29.4667 5.90283 29.4667H27.7195C28.6839 29.4667 29.6087 29.0914 30.2906 28.4234C30.9725 27.7554 31.3556 26.8494 31.3556 25.9048V11.6571C31.3556 10.7125 30.9725 9.80648 30.2906 9.1385C29.6087 8.47051 28.6839 8.09524 27.7195 8.09524H24.8361C24.3539 8.09514 23.8916 7.90743 23.5507 7.57342L21.5127 5.57697C20.8309 4.90894 19.9062 4.53353 18.9419 4.53333H14.6804C13.7161 4.53353 12.7914 4.90894 12.1097 5.57697L10.0716 7.57342C9.73076 7.90743 9.26841 8.09514 8.78627 8.09524H5.90283ZM16.8112 24.1238C17.5274 24.1238 18.2367 23.9856 18.8984 23.7171C19.5601 23.4486 20.1614 23.0551 20.6678 22.5589C21.1743 22.0628 21.5761 21.4738 21.8502 20.8256C22.1243 20.1773 22.2653 19.4826 22.2653 18.781C22.2653 18.0793 22.1243 17.3846 21.8502 16.7363C21.5761 16.0881 21.1743 15.4991 20.6678 15.003C20.1614 14.5069 19.5601 14.1133 18.8984 13.8448C18.2367 13.5763 17.5274 13.4381 16.8112 13.4381C15.3646 13.4381 13.9773 14.001 12.9545 15.003C11.9316 16.005 11.357 17.3639 11.357 18.781C11.357 20.198 11.9316 21.5569 12.9545 22.5589C13.9773 23.5609 15.3646 24.1238 16.8112 24.1238Z" stroke="black" stroke-opacity="0.5" stroke-width="2.26667" />
          </svg>
        </IconContainer>
        <Text>예문</Text>
      </StyledNavLink>

      {/* 둥근 홈 버튼 */}
      <StyledNavLink to="/">
        {currentPage === "Home" ? 
        <HomeContainer>
          <HomeIconContainer>
            <svg xmlns="http://www.w3.org/2000/svg" width="51" height="50" viewBox="0 0 51 50" fill="none">
              <path d="M21.3333 39.5833V29.1667H29.6666V39.5833C29.6666 40.7292 30.6041 41.6667 31.75 41.6667H38C39.1458 41.6667 40.0833 40.7292 40.0833 39.5833V25H43.625C44.5833 25 45.0416 23.8125 44.3125 23.1875L26.8958 7.5C26.1041 6.79167 24.8958 6.79167 24.1041 7.5L6.68746 23.1875C5.97913 23.8125 6.41663 25 7.37496 25H10.9166V39.5833C10.9166 40.7292 11.8541 41.6667 13 41.6667H19.25C20.3958 41.6667 21.3333 40.7292 21.3333 39.5833Z" fill="black" fill-opacity="0.5" />
            </svg>
          </HomeIconContainer>
          <HomeText>홈</HomeText>
        </HomeContainer>
        :
        <NotHomeContainer>
          <HomeIconContainer>
            <svg xmlns="http://www.w3.org/2000/svg" width="51" height="50" viewBox="0 0 51 50" fill="none">
              <path d="M21.3333 39.5833V29.1667H29.6666V39.5833C29.6666 40.7292 30.6041 41.6667 31.75 41.6667H38C39.1458 41.6667 40.0833 40.7292 40.0833 39.5833V25H43.625C44.5833 25 45.0416 23.8125 44.3125 23.1875L26.8958 7.5C26.1041 6.79167 24.8958 6.79167 24.1041 7.5L6.68746 23.1875C5.97913 23.8125 6.41663 25 7.37496 25H10.9166V39.5833C10.9166 40.7292 11.8541 41.6667 13 41.6667H19.25C20.3958 41.6667 21.3333 40.7292 21.3333 39.5833Z" fill="black" fill-opacity="0.5" />
            </svg>
          </HomeIconContainer>
          <HomeText>홈</HomeText>
        </NotHomeContainer>
        }
      </StyledNavLink>

      {/* 질문 버튼 */}
      <StyledNavLink to="/question">
        <IconContainer>
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 32 29" fill="none">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M6.50596 0.533333C5.88004 0.533333 5.37263 1.04074 5.37263 1.66667V8.43236H1.76664C1.14071 8.43236 0.633301 8.93977 0.633301 9.56569V27.7334C0.633301 28.1898 0.907097 28.6017 1.32794 28.7784C1.74879 28.955 2.23455 28.862 2.56035 28.5424L5.59654 25.5635H22.304C22.9299 25.5635 23.4373 25.0561 23.4373 24.4302V20.5727H26.1789L29.7965 24.1903C30.1206 24.5144 30.6081 24.6114 31.0316 24.4359C31.4551 24.2605 31.7312 23.8473 31.7312 23.3889V1.66667C31.7312 1.04074 31.2238 0.533333 30.5979 0.533333H6.50596ZM21.1707 20.5727H6.50596C5.88004 20.5727 5.37263 20.0653 5.37263 19.4394V10.699H2.89997V25.0337L4.3397 23.6212C4.55159 23.4133 4.83658 23.2968 5.13342 23.2968H21.1707V20.5727ZM7.6393 18.3061V2.8H29.4645V20.6528L27.4498 18.638C27.2372 18.4255 26.949 18.3061 26.6484 18.3061H7.6393Z" fill="black" fill-opacity="0.5" />
            <path d="M18.4826 14.2327V15.8847H16.7514V14.2327H18.4826ZM18.3082 12.2395V13.1132H16.8722C16.8185 12.5535 16.7916 12.1439 16.7916 11.7207C16.7916 10.7377 17.3285 10.1096 17.9726 9.54989C18.6571 8.96283 19.1402 8.37577 19.1402 7.55662C19.1402 6.61459 18.7108 6.13675 17.8519 6.13675C17.2077 6.13675 16.5098 6.47806 15.9059 7.06513L15.1946 6.02753C15.9596 5.20838 16.8587 4.8261 18.0934 4.8261C19.771 4.8261 20.7239 6.02753 20.7239 7.48836C20.7239 8.58056 19.9857 9.52259 19.2744 10.137C18.6705 10.6148 18.3082 11.1472 18.3082 12.2395Z" fill="black" fill-opacity="0.5" />
          </svg>
        </IconContainer>
        <Text>질문</Text>
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
  height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  transform: translateY(-50%);
`;

const NotHomeContainer = styled.div`
  background-color: #00daaa;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const HomeIconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const HomeText = styled.span`
  color: rgba(0, 0, 0, 0.5);
  font-size: 15px;
  font-weight: 500;
  text-align: center;
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

    & span {
      color: white;
    }

    & svg path{
      stroke: white;
      fill: white;
      fill-opacity: 1;
    }
  }
`;

const IconContainer = styled.div`
  margin: 5px;
`;

const Icon = styled.img`
  width: 40px;
  height: 40px;
`;

const Text = styled.span`
  font-size: 12px;
`;
