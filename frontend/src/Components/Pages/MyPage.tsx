import styled from "styled-components";
import NavBar from "../Templates/Navbar";
import { useState } from "react";

interface UserDataProps {
    userName: string;
    visitCount: number;
    gender: string;
    interest: string;
}

export default function MyPage(){

    const friendList = [
        {
            userName: "정찬우",
        },
        {
            userName: "강숙희",
        },
        {
            userName: "장환희",
        }
    ];

    const [userData, setUserData] = useState<UserDataProps>({
        userName: "김진희",
        visitCount: 10,
        gender: "여성",
        interest: "회화"
    });
    

    return (
        <MyPageContainer>
            <Div>
            <Profile>
                <div>
                <Img>
                </Img>
                <div>
                    <p>{userData.userName}</p>
                    <span>{userData.visitCount}번째 방문했어요!</span>
                </div>
                </div>

            </Profile>
            </Div>
            <Div>
            <FriendList>
                <Title>
                    나의 친구({friendList.length})
                </Title>
            </FriendList>
            </Div>
            <NavBar currentPage={"Home"} />
        </MyPageContainer>
    );
}

const MyPageContainer = styled.div`
  width: 100vw;
  height: 100vh;
`;

const Div = styled.div`
    padding: 3vh 5vw;
`;

const Profile = styled.div`
    width: 100%;
    height: 50px;
    border-radius: 20px;
    background: #6775F6;
`;

const FriendList = styled.div`
    width: 100%;
`;

const Title = styled.div`
    color: #000;
    font-family: KoPubWorldDotum_Pro;
    font-size: 22px;
    font-style: normal;
    font-weight: 700;
    line-height: 150%; /* 30px */
    letter-spacing: -0.6px;
`;

const Img = styled.div`

`;