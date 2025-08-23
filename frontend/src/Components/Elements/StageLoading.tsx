import React from "react";
import { Spinner } from "basic-loading";

const StageLoading = () => (
  <div className="w-full h-[calc(100vh-100px)] flex flex-col items-center justify-center overflow-hidden">
    <span className="text-2xl my-2">예문을 만들고 있어요.</span>
    <span className="text-2xl my-2">잠시 기다려주세요.</span>
    <Spinner
      option={{
        size: 50,
        bgColor: "#00daaa",
        barColor: "rgba(0, 218, 171, 0.44)",
      }}
    />
  </div>
);

export default StageLoading;
