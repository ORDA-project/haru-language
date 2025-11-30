import React from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../Templates/Navbar";

export default function VersionInfo() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen flex flex-col max-w-[440px] mx-auto bg-gray-50 shadow-[0_0_10px_0_rgba(0,0,0,0.1)]">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-800">버전정보</h1>
        </div>
        <div className="w-8"></div>
      </div>

      {/* 버전정보 내용 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="space-y-6">
            {/* 앱 정보 */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#00DAAA] to-[#00D999] rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">하</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">하루언어</h2>
              <p className="text-gray-500 text-sm">
                언어 학습을 위한 AI 기반 플랫폼
              </p>
            </div>

            {/* 버전 정보 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-700 font-medium">앱 버전</span>
                <span className="text-gray-900 font-semibold">0.0.1</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-700 font-medium">빌드 번호</span>
                <span className="text-gray-900 font-semibold">2025.01.01</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-700 font-medium">플랫폼</span>
                <span className="text-gray-900 font-semibold">Web</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-700 font-medium">개발사</span>
                <span className="text-gray-900 font-semibold">하루언어</span>
              </div>
            </div>

            {/* 오픈소스 라이센스 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                오픈소스 라이센스
              </h3>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">
                      MIT License
                    </span>
                    <span className="text-gray-500 text-sm">MIT</span>
                  </div>

                  <div className="text-sm text-gray-600 leading-relaxed">
                    <p className="mb-2">
                      <strong>MIT License</strong>
                    </p>
                    <p className="mb-2">Copyright (c) 2025 하루언어</p>
                    <p className="mb-2">
                      Permission is hereby granted, free of charge, to any
                      person obtaining a copy of this software and associated
                      documentation files (the "Software"), to deal in the
                      Software without restriction, including without limitation
                      the rights to use, copy, modify, merge, publish,
                      distribute, sublicense, and/or sell copies of the
                      Software, and to permit persons to whom the Software is
                      furnished to do so, subject to the following conditions:
                    </p>
                    <p className="mb-2">
                      The above copyright notice and this permission notice
                      shall be included in all copies or substantial portions of
                      the Software.
                    </p>
                    <p>
                      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
                      KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
                      WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
                      PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
                      OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
                      OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
                      OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
                      SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 사용된 기술 스택 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">기술 스택</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-blue-600 font-semibold text-sm">
                    Frontend
                  </div>
                  <div className="text-gray-600 text-xs mt-1">
                    React, TypeScript
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-green-600 font-semibold text-sm">
                    Backend
                  </div>
                  <div className="text-gray-600 text-xs mt-1">
                    Node.js, Express
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-purple-600 font-semibold text-sm">
                    Database
                  </div>
                  <div className="text-gray-600 text-xs mt-1">
                    MySQL, Sequelize
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <div className="text-orange-600 font-semibold text-sm">
                    Styling
                  </div>
                  <div className="text-gray-600 text-xs mt-1">Tailwind CSS</div>
                </div>
              </div>
            </div>

            {/* 연락처 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">연락처</h3>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      이메일
                    </div>
                    <div className="text-sm text-gray-600">
                      support@harulanguage.com
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      업데이트
                    </div>
                    <div className="text-sm text-gray-600">2025년 1월 1일</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 앱 정보 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  하루언어는 AI 기반의 언어 학습 플랫폼으로,
                  <br />
                  개인화된 학습 경험을 제공합니다.
                </p>
                <p className="text-xs text-gray-500">
                  © 2025 하루언어. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <NavBar currentPage="MyPage" />
    </div>
  );
}
