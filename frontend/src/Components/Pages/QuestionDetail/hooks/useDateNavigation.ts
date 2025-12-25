import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDateString } from "../utils";

interface UseDateNavigationProps {
  questionsData?: { data?: Array<{ created_at: string }> };
  exampleHistory?: { data?: Array<{ created_at?: string; createdAt?: string }> };
  writingRecordsData?: { data?: Array<{ created_at: string }> };
}

export const useDateNavigation = ({
  questionsData,
  exampleHistory,
  writingRecordsData,
}: UseDateNavigationProps) => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(date || "");

  useEffect(() => {
    if (date && date !== selectedDate) {
      setSelectedDate(date);
    }
  }, [date]);

  const availableDates = useMemo(() => {
    const dates = new Set<string>();

    const extractDate = (value?: string | null) => {
      if (!value) return;
      const dateStr = getDateString(value);
      if (dateStr) dates.add(dateStr);
    };

    questionsData?.data?.forEach((question) => extractDate(question.created_at));
    exampleHistory?.data?.forEach((example) =>
      extractDate(example.created_at || example.createdAt)
    );
    writingRecordsData?.data?.forEach((record: any) =>
      extractDate(record.created_at)
    );

    return Array.from(dates).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [questionsData?.data, exampleHistory?.data, writingRecordsData?.data]);

  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      const fallback = availableDates[0];
      setSelectedDate(fallback);
      navigate(`/question-detail/${fallback}`, { replace: true });
    }
  }, [availableDates, selectedDate, navigate]);

  const targetDate = useMemo(() => {
    if (!selectedDate) return "";
    return selectedDate;
  }, [selectedDate]);

  const currentIndex = availableDates.findIndex(
    (d) => d === selectedDate
  );
  const previousDate =
    currentIndex >= 0 && currentIndex < availableDates.length - 1
      ? availableDates[currentIndex + 1]
      : null;
  const nextDate = currentIndex > 0 ? availableDates[currentIndex - 1] : null;

  const handleNavigateToDate = (newDate: string) => {
    if (!newDate || newDate === selectedDate) return;
    setSelectedDate(newDate);
    navigate(`/question-detail/${newDate}`, { replace: true });
  };

  return {
    selectedDate,
    targetDate,
    availableDates,
    previousDate,
    nextDate,
    handleNavigateToDate,
  };
};

