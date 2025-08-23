import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Icons } from "../Elements/Icons";

interface NavBarProps {
  currentPage: string;
}

const NavBar = ({ currentPage }: NavBarProps) => {
  const location = useLocation();

  return (
    <div className="flex items-center justify-around bg-[#00daaa] fixed bottom-0 left-0 right-0 w-full max-w-[440px] mx-auto box-border h-[80px]">
      {/* 예문 버튼 */}
      <NavLink
        to="/example"
        className={`flex flex-col items-center justify-center no-underline text-[12px] font-medium h-full ${
          location.pathname === "/example"
            ? "text-white"
            : "text-black text-opacity-50"
        }`}
      >
        <div className="m-[5px]">
          <Icons.camera
            stroke={location.pathname === "/example" ? "white" : "black"}
            strokeOpacity={location.pathname === "/example" ? "1" : "0.5"}
          />
        </div>
        <span className="text-[12px]">예문</span>
      </NavLink>

      {/* 둥근 홈 버튼 */}
      <NavLink
        to="/home"
        className="flex flex-col items-center justify-center no-underline text-[12px] font-medium h-full"
      >
        {location.pathname === "/home" ? (
          <div className="bg-[#00daaa] w-[80px] h-[80px] rounded-full flex flex-col justify-center items-center -translate-y-[30px]">
            <div className="flex justify-center items-center">
              <Icons.home fill="white" fillOpacity="1" />
            </div>
            <span className="text-white text-[15px] font-medium text-center">
              홈
            </span>
          </div>
        ) : (
          <div className="bg-[#00daaa] w-[80px] h-[80px] rounded-full flex flex-col justify-center items-center -translate-y-[30px]">
            <div className="flex justify-center items-center">
              <Icons.home />
            </div>
            <span className="text-black text-opacity-50 text-[15px] font-medium text-center">
              홈
            </span>
          </div>
        )}
      </NavLink>

      {/* 프로필 버튼 */}
      <NavLink
        to="/mypage"
        className={`flex flex-col items-center justify-center no-underline text-[12px] font-medium h-full ${
          location.pathname === "/mypage"
            ? "text-white"
            : "text-black text-opacity-50"
        }`}
      >
        <div className="m-[5px]">
          <Icons.profile
            stroke={location.pathname === "/mypage" ? "white" : "black"}
            strokeOpacity={location.pathname === "/mypage" ? "1" : "0.5"}
          />
        </div>
        <span className="text-[12px]">프로필</span>
      </NavLink>
    </div>
  );
};

export default NavBar;
