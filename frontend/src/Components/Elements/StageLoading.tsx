import React from "react";
import { Stage, Span } from "../../Styles/Example";
import { Spinner } from "basic-loading";

const StageLoading = () => (
  <Stage>
    <Span>예문을 만들고 있어요.</Span>
    <Span>잠시 기다려주세요.</Span>
    <Spinner
      option={{
        size: 50,
        bgColor: "#00daaa",
        barColor: "rgba(0, 218, 171, 0.44)",
      }}
    />
  </Stage>
);

export default StageLoading;
