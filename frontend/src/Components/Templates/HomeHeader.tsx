import LogoImg from "../../Images/LogoImg.png";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface HomeHeaderProps {}

const HomeHeader = (props: HomeHeaderProps) => {
  const navigate = useNavigate(); // useNavigate 위치 수정

  const LogOut = async () => {
    try {
      // 로그아웃 요청
      const res = await axios({
        method: "GET",
        url: "http://localhost:8000/auth/logout",
        withCredentials: true, // 자격 증명 포함
      });

      // 요청 성공 시
      console.log("Logged out successfully:", res);
      navigate("/"); // 홈으로 리다이렉트
    } catch (error) {
      // 에러 처리
      console.error("Error during logout:", error);
      alert("로그아웃 실패. 다시 시도해주세요.");
    }
  };

  return (
    <div className="flex justify-between items-center w-full box-border max-w-[440px] h-[80px] p-[12px_20px] mx-auto z-10 border-[#e0e0e0] bg-[#F7F8FB]">
      <div className="flex items-center">
        {/* <LogoSvg /> */}
        <img src={LogoImg} alt="" className="w-[30px] h-[30px] m-[5px]" />
        <p className="flex-col flex justify-center items-center">
          <span className="text-[16px] leading-5 text-[#004435] ">하루</span>
          <span className="text-[16px] leading-5 text-[#004435] ">언어</span>
        </p>
      </div>
    </div>
  );
};

export default HomeHeader;
