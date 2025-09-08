import React from "react";

const StageLoading = () => (
  <div className="w-full h-full flex flex-col bg-[#F7F8FB]">
    {/* Header */}
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div className="w-8"></div>
      <div className="text-center">
        <h1 className="text-lg font-semibold text-gray-800">예문 생성</h1>
      </div>
      <div className="w-8"></div>
    </div>

    {/* Content */}
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#00DAAA] rounded-full flex items-center justify-center mb-6 mx-auto">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          예문을 만들고 있어요
        </h2>
        <p className="text-gray-600">잠시 기다려주세요</p>
      </div>
    </div>
  </div>
);

export default StageLoading;
