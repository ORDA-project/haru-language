import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";
import { Icons } from "../Elements/Icons";

// 아이콘들을 개별적으로 메모이제이션
const MemoizedCamera = React.memo((props: React.SVGProps<SVGSVGElement>) => (
  <Icons.camera {...props} />
));
const MemoizedHome = React.memo((props: React.SVGProps<SVGSVGElement>) => (
  <Icons.home {...props} />
));
const MemoizedProfile = React.memo((props: React.SVGProps<SVGSVGElement>) => (
  <Icons.profile {...props} />
));

interface NavBarProps {
  currentPage: string;
}

const NavBar = ({ currentPage }: NavBarProps) => {
  const location = useLocation();
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  
  const labelFontSize = isLargeTextMode ? 14 : 12;
  const homeLabelFontSize = isLargeTextMode ? 16 : 15;
  
  const labelStyle: React.CSSProperties = { fontSize: `${labelFontSize}px` };
  const homeLabelStyle: React.CSSProperties = { fontSize: `${homeLabelFontSize}px` };

  return (
    <div className="flex items-center justify-around bg-[#00daaa] fixed bottom-0 left-0 right-0 w-full max-w-[440px] mx-auto box-border h-[72px]">
      {/* 예문 버튼 */}
      <NavLink
        to="/example"
        className={`flex flex-col items-center justify-center no-underline font-medium h-full ${
          location.pathname === "/example"
            ? "text-white"
            : "text-black text-opacity-50"
        }`}
        style={labelStyle}
      >
        <div className="m-[5px]">
          <MemoizedCamera
            stroke={location.pathname === "/example" ? "white" : "black"}
            strokeOpacity={location.pathname === "/example" ? "1" : "0.5"}
          />
        </div>
        <span>예문</span>
      </NavLink>

      {/* 둥근 홈 버튼 */}
      <NavLink
        to="/home"
        className="flex flex-col items-center justify-center no-underline font-medium h-full"
      >
        {location.pathname === "/home" ? (
          <div className="bg-[#00daaa] w-[72px] h-[72px] rounded-full flex flex-col justify-center items-center">
            <div className="flex justify-center items-center">
              <MemoizedHome fill="white" fillOpacity="1" />
            </div>
            <span className="text-white font-medium text-center" style={homeLabelStyle}>
              홈
            </span>
          </div>
        ) : (
          <div className="bg-[#00daaa] w-[72px] h-[72px] rounded-full flex flex-col justify-center items-center">
            <div className="flex justify-center items-center">
              <MemoizedHome />
            </div>
            <span className="text-black text-opacity-50 font-medium text-center" style={homeLabelStyle}>
              홈
            </span>
          </div>
        )}
      </NavLink>

      {/* 프로필 버튼 */}
      <NavLink
        to="/mypage"
        className={`flex flex-col items-center justify-center no-underline font-medium h-full ${
          location.pathname === "/mypage" ||
          location.pathname.startsWith("/mypage/edit")
            ? "text-white"
            : "text-black text-opacity-50"
        }`}
        style={labelStyle}
      >
        <div className="m-[5px]">
          <MemoizedProfile
            stroke={
              location.pathname === "/mypage" ||
              location.pathname.startsWith("/mypage/edit")
                ? "white"
                : "black"
            }
            strokeOpacity={
              location.pathname === "/mypage" ||
              location.pathname.startsWith("/mypage/edit")
                ? "1"
                : "0.5"
            }
          />
        </div>
        <span>프로필</span>
      </NavLink>
    </div>
  );
};

export default NavBar;
