import React, { useRef, useState, useEffect } from "react";
import { Icons } from "./Icons";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (file: File) => void;
  title?: string;
}

const ImageUploadModal = ({
  isOpen,
  onClose,
  onImageSelect,
  title = "이미지 선택",
}: ImageUploadModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  // 카메라 스트림 정리 함수 (상태 업데이트 없이 리소스만 정리)
  const cleanupResources = () => {
    // 타이머 정리
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // 스트림 정리
    const currentStream = streamRef.current;
    if (currentStream) {
      try {
        currentStream.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (error) {
        console.error("스트림 정리 오류:", error);
      }
      streamRef.current = null;
    }

    // 비디오 정리
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
        videoRef.current.pause();
      } catch (error) {
        console.error("비디오 정리 오류:", error);
      }
    }
  };

  // 카메라 스트림 정리 함수 (상태 포함)
  const cleanupCamera = () => {
    cleanupResources();
    // 상태 초기화
    setStream(null);
    setIsCameraOpen(false);
    setShowGuide(true);
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanupResources();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 모달이 닫힐 때 카메라 정리
  useEffect(() => {
    if (!isOpen && isCameraOpen) {
      cleanupResources();
      setStream(null);
      setIsCameraOpen(false);
      setShowGuide(true);
    }
  }, [isOpen, isCameraOpen]);

  // 카메라가 열릴 때 비디오 재생 확인
  useEffect(() => {
    if (!isCameraOpen || !videoRef.current || !stream) return;

    const video = videoRef.current;
    const mountedRef = { current: true };

    const playVideo = () => {
      if (!mountedRef.current || !video || !video.srcObject) return;
      
      // 비디오가 준비되지 않았으면 대기
      if (video.readyState < 2) {
        return;
      }
      
      // 여러 방법으로 재생 시도
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("비디오 재생 성공");
          })
          .catch((err) => {
            console.error("비디오 재생 오류:", err);
            // 재생 실패 시 여러 번 재시도
            let retryCount = 0;
            const maxRetries = 3;
            
            const retryPlay = () => {
              if (retryCount < maxRetries && mountedRef.current && video && video.srcObject) {
                retryCount++;
                setTimeout(() => {
                  if (mountedRef.current && video && video.srcObject) {
                    video.play()
                      .then(() => {
                        console.log(`비디오 재생 재시도 ${retryCount} 성공`);
                      })
                      .catch((e) => {
                        console.error(`비디오 재생 재시도 ${retryCount} 실패:`, e);
                        if (retryCount < maxRetries) {
                          retryPlay();
                        }
                      });
                  }
                }, 200 * retryCount);
              }
            };
            
            retryPlay();
          });
      }
    };

    const handleLoadedMetadata = () => {
      if (!mountedRef.current || !video) return;
      playVideo();
    };

    const handleLoadedData = () => {
      if (!mountedRef.current || !video) return;
      playVideo();
    };

    const handleCanPlay = () => {
      if (!mountedRef.current || !video) return;
      playVideo();
    };

    const handlePlay = () => {
      if (!mountedRef.current) return;
      // 비디오가 재생되면 가이드 메시지를 3초 후에 숨김
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setShowGuide((prev) => {
            if (prev) return false;
            return prev;
          });
        }
      }, 3000);
    };

    // 여러 이벤트 리스너 등록
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("play", handlePlay);

    // 이미 로드된 경우 즉시 재생 시도
    if (video.readyState >= 2) {
      setTimeout(() => {
        if (mountedRef.current) {
          playVideo();
        }
      }, 100);
    } else {
      // 로드되지 않은 경우 짧은 지연 후 재생 시도
      setTimeout(() => {
        if (mountedRef.current) {
          playVideo();
        }
      }, 200);
    }

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("play", handlePlay);
    };
  }, [isCameraOpen, stream]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
      onClose();
    }
  };

  const handleCameraClick = async () => {
    try {
      // 기존 스트림이 있으면 정리
      cleanupResources();

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // 후면 카메라 우선
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsCameraOpen(true);
      setShowGuide(true);

      // 비디오 요소에 스트림 연결
      if (videoRef.current) {
        const video = videoRef.current;
        
        // 기존 srcObject 정리
        if (video.srcObject) {
          const oldStream = video.srcObject as MediaStream;
          oldStream.getTracks().forEach((track) => track.stop());
        }
        
        // 스트림 연결
        video.srcObject = mediaStream;
        
        // 모바일에서 재생을 보장하기 위한 추가 설정
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        video.setAttribute("x5-playsinline", "true");
        video.setAttribute("x5-video-player-type", "h5");
        video.setAttribute("x5-video-player-fullscreen", "false");
        
        // 비디오 속성 설정
        video.muted = true;
        video.playsInline = true;
        
        // 여러 시점에서 재생 시도
        const attemptPlay = () => {
          if (video && video.srcObject && video.readyState >= 2) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log("비디오 재생 성공");
                })
                .catch((err) => {
                  console.error("비디오 재생 실패:", err);
                });
            }
          }
        };
        
        // 즉시 시도
        attemptPlay();
        
        // 짧은 지연 후 재시도
        setTimeout(attemptPlay, 50);
        setTimeout(attemptPlay, 150);
        setTimeout(attemptPlay, 300);
      }
    } catch (error) {
      console.error("카메라 접근 오류:", error);
      alert("카메라에 접근할 수 없습니다. 갤러리에서 이미지를 선택해주세요.");
      cleanupResources();
      setStream(null);
      setIsCameraOpen(false);
      setShowGuide(true);
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("비디오 또는 캔버스가 없습니다.");
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      console.error("캔버스 컨텍스트를 가져올 수 없습니다.");
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error("비디오가 아직 준비되지 않았습니다.");
      return;
    }

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error("이미지 변환 실패");
            return;
          }

          // 카메라 스트림 정리
          cleanupCamera();

          // 파일 생성 및 전달
          const file = new File([blob], "camera-photo.jpg", {
            type: "image/jpeg",
          });

          // 상태 업데이트 후 콜백 호출
          onImageSelect(file);
          onClose();
        },
        "image/jpeg",
        0.8
      );
    } catch (error) {
      console.error("사진 촬영 오류:", error);
      alert("사진을 촬영하는 중 오류가 발생했습니다.");
    }
  };

  const handleCloseCamera = () => {
    cleanupCamera();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (isCameraOpen) {
        handleCloseCamera();
      } else {
        onClose();
      }
    }
  };

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4">
        {!isCameraOpen ? (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <button
                onClick={handleCameraClick}
                className="w-full flex items-center justify-center space-x-3 py-4 bg-[#00DAAA] hover:bg-[#00C495] text-white rounded-xl transition-colors"
              >
                <Icons.camera
                  className="w-6 h-6"
                  stroke="white"
                  strokeOpacity="1"
                />
                <span className="font-medium">카메라로 촬영</span>
              </button>

              <button
                onClick={handleGalleryClick}
                className="w-full flex items-center justify-center space-x-3 py-4 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 rounded-xl transition-colors"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-gray-600"
                >
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="14,2 14,8 20,8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="16"
                    y1="13"
                    x2="8"
                    y2="13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="16"
                    y1="17"
                    x2="8"
                    y2="17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-medium">갤러리에서 선택</span>
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={onClose}
              className="w-full mt-4 py-3 text-gray-500 hover:text-gray-700 transition-colors"
            >
              취소
            </button>
          </>
        ) : (
          <>
            {/* Camera View */}
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">사진 촬영</h2>
            </div>

            {/* 안내 팝업 메시지 - 카메라 위에 표시 */}
            {showGuide && (
              <div className="mb-4 bg-gray-100 border-2 border-blue-500 rounded-2xl px-4 py-3 shadow-lg">
                <p className="text-center text-black text-sm font-medium leading-relaxed">
                  챕터 명과 예문문장이<br />잘 보이게 찍어주세요!
                </p>
              </div>
            )}

            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "256px",
                  objectFit: "cover",
                  backgroundColor: "#111827",
                }}
                className="rounded-xl"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Camera Controls */}
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={handleCloseCamera}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCapturePhoto}
                className="w-16 h-16 bg-[#00DAAA] hover:bg-[#00C495] rounded-full flex items-center justify-center transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageUploadModal;
