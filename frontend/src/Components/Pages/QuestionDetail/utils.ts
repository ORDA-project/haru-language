export const getDateString = (dateValue: string | Date): string => {
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  const koreaTime = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const year = koreaTime.getFullYear();
  const month = String(koreaTime.getMonth() + 1).padStart(2, '0');
  const day = String(koreaTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (isoDate?: string): string => {
  if (!isoDate) return "날짜 선택";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "날짜 선택";
  return parsed.toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
};

export const parseGeneratedExample = (rawDescription?: string) => {
  if (!rawDescription) return null;

  const firstBrace = rawDescription.indexOf("{");
  const lastBrace = rawDescription.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return null;

  const candidate = rawDescription.slice(firstBrace, lastBrace + 1);

  try {
    const parsed = JSON.parse(candidate);
    if (parsed?.generatedExample) {
      return parsed.generatedExample;
    }
    return parsed;
  } catch {
    return null;
  }
};

