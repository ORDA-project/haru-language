import React from "react";
import { NavLink } from "react-router-dom";

import exampleIcon from "../Images/example.png";
import homeIcon from "../Images/home.png";
import questionIcon from "../Images/question.png";

const NavBar = () => {
  return (
    <div style={styles.navbar}>
      {/* 예문 버튼 */}
      <NavLink
        to="/example"
        style={({ isActive }) =>
          isActive
            ? { ...styles.navButton, ...styles.activeNavButton }
            : styles.navButton
        }
      >
        <div style={styles.icon}>
          <img src={exampleIcon} alt="예문" style={styles.image} />
        </div>
        <span>예문</span>
      </NavLink>

      {/* 둥근 홈 버튼 */}
      <div style={styles.homeContainer}>
        <NavLink
          to="/home"
          style={({ isActive }) =>
            isActive
              ? { ...styles.navButton, ...styles.activeNavButton }
              : styles.navButton
          }
        >
          <div style={styles.homeIcon}>
            <img src={homeIcon} alt="홈" style={styles.image} />
          </div>
          <span style={styles.homeText}>홈</span>
        </NavLink>
      </div>

      {/* 질문 버튼 */}
      <NavLink
        to="/question"
        style={({ isActive }) =>
          isActive
            ? { ...styles.navButton, ...styles.activeNavButton }
            : styles.navButton
        }
      >
        <div style={styles.icon}>
          <img src={questionIcon} alt="질문" style={styles.image} />
        </div>
        <span>질문</span>
      </NavLink>
    </div>
  );
};

export default NavBar;

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#00DAAA", // 초록색 배경
    position: "fixed",
    bottom: 0,
    width: "100%",
    height: "100px",
    padding: "0 20px",
    borderRadius: "0px",
  },
  homeContainer: {
    position: "absolute",
    bottom: "60px", // 홈 버튼이 올라오도록 설정
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#00DAAA",
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
    zIndex: 10,
  },
  navButton: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    color: "rgba(0, 0, 0, 0.5)",
    fontSize: "12px",
    fontWeight: "500",
    height: "100%", 
  },
  activeNavButton: {
    color: "white",
  },
  icon: {
    marginBottom: "5px",
  },
  image: {
    width: "30px",
    height: "30px",
  },
  homeIcon: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  homeText: {
    marginTop: "5px",
    color: "rgba(0, 0, 0, 0.5)",
    fontSize: "12px",
    fontWeight: "500",
    textAlign: "center",
  },
};
