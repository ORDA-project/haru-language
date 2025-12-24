import LogoImg from "../../Images/LogoImg.png";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { apiClient } from "../../utils/errorHandler";

interface HomeHeaderProps {}

const HomeHeader = (props: HomeHeaderProps) => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo, handleError } = useErrorHandler();
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  
  // 큰글씨 모드에 따른 텍스트 크기 (중년층용)
  const baseFontSize = isLargeTextMode ? 18 : 16;
  
  const baseTextStyle: React.CSSProperties = { fontSize: `${baseFontSize}px` };

  const LogOut = async () => {
    try {
      // 로그아웃 진행 중 토스트 표시
      showInfo('로그아웃 중', '잠시만 기다려주세요...');
      
      // 로그아웃 요청
      const res = await apiClient.get("/auth/logout");

      // 요청 성공 시
      showSuccess('로그아웃 완료', '안전하게 로그아웃되었습니다.');
      
      // 약간의 딜레이 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      // 에러 처리
      console.error("Error during logout:", error);
      handleError(error);
      showError('로그아웃 실패', '로그아웃 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex justify-between items-center w-full box-border max-w-[440px] h-[80px] p-[12px_20px] mx-auto z-10 border-[#e0e0e0] bg-[#F7F8FB]">
      <div className="flex items-center">
        {/* <LogoSvg /> */}
        <img src={LogoImg} alt="" className="w-[30px] h-[30px] m-[5px]" />
        <p className="flex-col flex justify-center items-center">
          <span className="leading-5 text-[#004435]" style={baseTextStyle}>하루</span>
          <span className="leading-5 text-[#004435]" style={baseTextStyle}>언어</span>
        </p>
      </div>
    </div>
  );
};

export default HomeHeader;
