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
                            <span style={{ fontSize: "24px", fontWeight: 700, color: "black" }}>{userData.userName}</span>
                            <span style={{ fontSize: "18px", fontWeight: 500, color: "black" }}>{userData.visitCount}번째 방문했어요!</span>
                        </div>
                    </div>
                    <div style={{ margin: "15px 0", display: "flex", alignItems: "center", justifyContent: "space-evenly" }}>
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px"}}>
                        <Title>
                            나의 친구({friendList.length})
                        </Title>
                        <FriendLink>
                            <span style={{padding: "10px"}}>친구링크 복사</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="27" height="28" viewBox="0 0 27 28" fill="none">
                                <path d="M10.1242 17.3749L16.8742 10.6249M12.3742 7.24986L12.895 6.64686C13.9501 5.59197 15.3809 4.99941 16.8729 4.99951C18.3648 4.99962 19.7956 5.59239 20.8505 6.64742C21.9054 7.70245 22.4979 9.13332 22.4978 10.6253C22.4977 12.1172 21.9049 13.548 20.8499 14.6029L20.2492 15.1249M14.6242 20.7499L14.1775 21.3506C13.1099 22.4055 11.6695 22.9971 10.1686 22.9971C8.6677 22.9971 7.22729 22.4055 6.15966 21.3506C5.63329 20.8306 5.21537 20.2112 4.93015 19.5285C4.64492 18.8457 4.49805 18.1131 4.49805 17.3732C4.49805 16.6332 4.64492 15.9006 4.93015 15.2179C5.21537 14.5351 5.63329 13.9158 6.15966 13.3957L6.74916 12.8749" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </FriendLink>
                    </div>
                    <FriendsDiv>
                        {friendList.map((friend) => {
                            return (
                                <FriendBox>
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <Img>
                                        </Img>
                                        <span style={{ margin: "0 10px" }}>{friend.userName}</span>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", height: "80px", justifyContent: "space-evenly" }}>
                                        <Button>콕 찌르기</Button>
                                        <span>학습 7회, 작문 15회</span>
                                    </div>
                                </FriendBox>
                            );
                        })}
                    </FriendsDiv>
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
    padding: 2vh 5vw;
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
    background: #FFB547;
`;

const FriendList = styled.div`
    width: 100%;
    max-height: 50vh;
    overflow: scroll;
`;

const FriendLink = styled.div`
    border-radius: 30px;
    border: 4px solid #00DAAA;
    background: #FFF;
    /* 기본 음영 */
    box-shadow: 0px 3px 7px 2px rgba(0, 0, 0, 0.05);
    display: inline-flex;
    height: 30px;
    padding: 4px 18px;
    justify-content: flex-end;
    align-items: center;
    flex-shrink: 0;
`;

const Title = styled.div`
    color: #000;
    font-family: KoPubWorldDotum_Pro;
    font-size: 25px;
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

const FriendsDiv = styled.div`

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