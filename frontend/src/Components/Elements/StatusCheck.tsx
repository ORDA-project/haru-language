import { useNavigate } from "react-router-dom";

interface StatusProps {}

const StatusCheck = (props: StatusProps) => {
  const navigate = useNavigate();

  const progressRecords = [
    {
      date: "09/30",
      content:
        "What do you do?\n'너는 무슨 일을 하니?'\n🔥주요 단어: incredible (굉장한)",
    },
    {
      date: "09/24",
      content:
        "How do you feel today?\n'오늘 기분 어때?'\n🔥주요 표현: I feel incredible. (정말 기분이 좋다)",
    },
    {
      date: "09/18",
      content:
        "I have been working for a year.\n'나는 일을 시작한 지 벌써 1년이 되었어.'\n🔥주요 표현: for a year (1년 동안), 벌써 (already)",
    },
    {
      date: "09/17",
      content:
        "08/29~09/10 진도 점검: 복습\n🔥주요 단어: progress (진전), review (복습)",
    },
    {
      date: "09/10",
      content:
        "My hobby is drinking tea.\n'내 취미는 차 마시기야.'\n🔥주요 단어: hobby (취미), drinking (마시는 것)",
    },
    {
      date: "09/05",
      content:
        "Do you like sweets?\n'너 단 거 좋아해?'\n🔥주요 표현: I like bitter chocolate. (나는 쓴 초콜릿을 좋아해.)",
    },
    {
      date: "08/29",
      content:
        "What's popular these days?\n'요즘 유행하는 건 뭐야?'\n🔥주요 단어: popular (인기 있는), these days (요즘)",
    },
  ];

  return (
    <div className="flex flex-col justify-center items-center w-full">
      {/* <button className="rounded-[20px] border-0 bg-[#fcc21b] shadow-[0px_3px_7px_2px_rgba(0,0,0,0.05)] w-[95%] p-[21px_17px] text-[19px] font-bold leading-[150%] m-[25px]" onClick={() => {navigate("/quiz");}}>진도 점검 하러 가기</button> */}
      <div className="rounded-[10px] bg-[#d2deed] w-[90%] flex flex-col items-start p-[15px] shadow-[0px_3px_7px_rgba(0,0,0,0.1)] m-[10px]">
        <div className="text-[19px] font-bold mb-[10px] text-center w-full">
          지난 시간에는 이런 걸 배웠어요📝
        </div>
        {progressRecords.map((record, index) => (
          <div
            key={index}
            className="min-h-[70px] flex items-start p-[12px_15px] bg-white rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] mb-[12px] w-[91%] h-[100px] overflow-hidden"
          >
            <div className="text-[18px] font-bold text-[#666] w-[60px] mr-[10px] flex-shrink-0">
              {record.date}
            </div>
            <div className="text-[18px] text-[#333] flex-1 overflow-hidden">
              <div
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "pre-line",
                }}
              >
                {record.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusCheck;
