import styled from "styled-components";

interface StatusProps {

}

const StatusCheck = (props: StatusProps) => {
    return (
        <StatusContainer>
            <Button>진도 점검 하러 가기</Button>
            <StatusRecord>

            </StatusRecord>
        </StatusContainer>
    )
};

export default StatusCheck;

const StatusContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const Button = styled.button`
    border-radius: 20px;
    border: 0;
    background: #FCC21B;
    box-shadow: 0px 3px 7px 2px rgba(0, 0, 0, 0.05);
    width: 95%;
    padding: 21px 17px;
    font-size: 19px;
    font-weight: 700;
    line-height: 150%;
    margin: 25px;
`;

const StatusRecord = styled.div`
    border-radius: 10px;
    background: #D2DEED;
    width: 100%;
    height: 10px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`;