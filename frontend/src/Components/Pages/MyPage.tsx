import styled from "styled-components";
import NavBar from "../Templates/Navbar";
import { useState } from "react";

interface UserDataProps {
    userName: string;
    visitCount: number;
    gender: string;
    interest: string;
}

export default function MyPage() {

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
                    <div style={{ display: 'flex' }}>
                        <Img>
                        </Img>
                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-evenly", margin: "0 20px" }}>
                            <span style={{ fontSize: "24px", fontWeight: 700, color: "white" }}>{userData.userName}</span>
                            <span style={{ fontSize: "18px", fontWeight: 500, color: "white" }}>{userData.visitCount}번째 방문했어요!</span>
                        </div>
                    </div>
                    <div style={{ margin: "15px 0", display: "flex", alignItems: "center", justifyContent: "space-evenly"}}>
                        <div style={{ padding: "10px 20px", alignItems: "center", borderRadius: "60px", background: "white", height: "fit-content" }}>여성</div>
                        <div style={{ padding: "10px 20px", alignItems: "center", borderRadius: "60px", background: "white", height: "fit-content" }}>회화</div>
                        <IconDiv>
                            <svg xmlns="http://www.w3.org/2000/svg" width="27" height="22" viewBox="0 0 27 22" fill="none">
                                <path d="M2 9.40005C1.2268 9.40005 0.6 10.0269 0.6 10.8C0.6 11.5732 1.2268 12.2 2 12.2L2 9.40005ZM26.0899 11.79C26.6367 11.2433 26.6367 10.3568 26.0899 9.8101L17.1804 0.900555C16.6337 0.353821 15.7472 0.353821 15.2005 0.900555C14.6538 1.44729 14.6538 2.33372 15.2005 2.88045L23.1201 10.8001L15.2005 18.7196C14.6538 19.2664 14.6538 20.1528 15.2005 20.6995C15.7472 21.2463 16.6337 21.2463 17.1804 20.6995L26.0899 11.79ZM2 12.2L25.1 12.2001L25.1 9.40005L2 9.40005L2 12.2Z" fill="black" />
                            </svg>
                        </IconDiv>
                    </div>
                </Profile>
            </Div>
            <Div>
                <FriendList>
                    <Title>
                        나의 친구({friendList.length})
                    </Title>
                    {friendList.map((friend) => {
                        return (
                            <FriendBox>
                                <div style={{display: "flex", alignItems: "center"}}>
                                <Img>
                                </Img>
                                <span style={{margin: "0 10px"}}>{friend.userName}</span>
                                </div>
                                <div style={{display: "flex", flexDirection: "column", height: "80px", justifyContent: "space-evenly"}}>
                                    <Button>콕 찌르기</Button>
                                    <span>학습 7회, 작문 15회</span>
                                </div>
                            </FriendBox>
                        );
                    })}
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

const Button = styled.button`
    border-radius: 20px;
    border: 0;
    background: #00DAAA;
    padding: 5px 20px;
    justify-content: center;
    align-items: center;
`;

const Profile = styled.div`
    // width: 100%;
    // height: 50px;
    padding: 20px;
    border-radius: 20px;
    background: #6775F6;
`;

const FriendList = styled.div`
    width: 100%;
    max-height: 50vh;
    overflow: scroll;
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

const Img = styled.img`
    width: 80px;
    height: 80px;
    border-radius: 100%;
    background: silver;
`;

const IconDiv = styled.div`
  border-radius: 70px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.00) 0%, #FFF 100%);
  width: 50%; 
  height: 50px;
  display: flex;
  justify-content: flex-end;
  align-items: center;

  & svg {
    transform: translateX(-15px);
  }
`;

const FriendBox = styled.div`
  border-radius: 20px;
  background: #FFF;
  box-shadow: 0px 0px 20px -5px rgba(0, 0, 0, 0.25);
  display: flex;
  padding: 9px 23px;
  margin: 10px;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
`;