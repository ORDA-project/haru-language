import styled from "styled-components";
import LogoImg from "../../Images/LogoImg.png"

interface HomeHeaderProps {

}

const HomeHeader = (props: HomeHeaderProps) => {
    return (
        <HomeHeaderContainer>
            <Logo>
                {/* <LogoSvg /> */}
                <img src={LogoImg} alt="" style={{width: "30px", height: "30px"}}/>
                <span style={{fontSize: "24px"}}>하루언어</span>
            </Logo>
            <MyAccount>
                <Profile>
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M20 25C17.7084 25 15.7466 24.1841 14.1146 22.5521C12.4827 20.9202 11.6667 18.9584 11.6667 16.6667C11.6667 14.375 12.4827 12.4132 14.1146 10.7813C15.7466 9.14935 17.7084 8.33337 20 8.33337C22.2917 8.33337 24.2535 9.14935 25.8855 10.7813C27.5174 12.4132 28.3334 14.375 28.3334 16.6667C28.3334 18.9584 27.5174 20.9202 25.8855 22.5521C24.2535 24.1841 22.2917 25 20 25ZM3.33337 37.5V35.8334C3.33337 34.6528 3.63754 33.5681 4.24587 32.5792C4.85421 31.5903 5.66115 30.8348 6.66671 30.3125C8.81949 29.2362 11.007 28.4292 13.2292 27.8917C15.4514 27.3542 17.7084 27.0848 20 27.0834C22.2917 27.082 24.5487 27.3514 26.7709 27.8917C28.9931 28.432 31.1806 29.2389 33.3334 30.3125C34.3403 30.8334 35.148 31.5889 35.7563 32.5792C36.3646 33.5695 36.6681 34.6542 36.6667 35.8334V37.5C36.6667 38.6459 36.2591 39.6271 35.4438 40.4438C34.6285 41.2605 33.6473 41.6681 32.5 41.6667H7.50004C6.35421 41.6667 5.37365 41.2591 4.55837 40.4438C3.7431 39.6285 3.33476 38.6473 3.33337 37.5Z" fill="white" />
                </svg>
                </Profile>
                <div>
                    <span style={{fontSize: "14px", color: "#B4B2B3"}}>내 계정</span>
                </div>
            </MyAccount>

        </HomeHeaderContainer>
    )

}

export default HomeHeader;

const HomeHeaderContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 90vw;
    height: 10vh;
    position: fixed;
    top: 0;
    left: 0;
    padding: 5vw;
    background: linear-gradient(to bottom, #ffffff, #ffffffa1);
    z-index: 10;
`;

const MyAccount = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    & div {
        margin: 2px;
    }
`;

const Profile = styled.div`
    display: flex;
    width: 40px;
    height: 40px;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    border-radius: 100%;
    background: #D2DEED;
`;

const Logo = styled.div`
    display: flex;
    align-items: center;

    & img, & span {
        margin: 5px;
    }
`;