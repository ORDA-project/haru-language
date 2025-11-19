import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

// 퀴즈 관련 타입 정의
export interface QuizQuestion {
  question: string;
  description: string;
  answer: "O" | "X";
}

export interface QuizResult {
  questions: QuizQuestion[];
  correctCount: number;
  totalCount: number;
  completedAt: Date;
}

export interface QuizState {
  currentQuiz: QuizQuestion[] | null;
  quizHistory: QuizResult[];
  isLoading: boolean;
}

// 추천 곡 관련 타입 정의
export interface SongRecommendation {
  title: string;
  artist: string;
  lyric: string;
  recommendedAt: Date;
}

export interface SongState {
  currentSong: SongRecommendation | null;
  songHistory: SongRecommendation[];
  isLoading: boolean;
}

// sessionStorage를 사용하는 storage 생성
const quizStorage = createJSONStorage<QuizState>(() => sessionStorage);
const songStorage = createJSONStorage<SongState>(() => sessionStorage);

// 퀴즈 상태를 sessionStorage에 저장하는 atom
export const quizStateAtom = atomWithStorage<QuizState>(
  "quizState",
  {
    currentQuiz: null,
    quizHistory: [],
    isLoading: false,
  },
  quizStorage
);

// 추천 곡 상태를 sessionStorage에 저장하는 atom
export const songStateAtom = atomWithStorage<SongState>(
  "songState",
  {
    currentSong: null,
    songHistory: [],
    isLoading: false,
  },
  songStorage
);

// 퀴즈 관련 액션 atoms
export const setCurrentQuizAtom = atom(
  null,
  (get, set, questions: QuizQuestion[]) => {
    const currentState = get(quizStateAtom);
    set(quizStateAtom, {
      ...currentState,
      currentQuiz: questions,
      isLoading: false,
    });
  }
);

export const setQuizLoadingAtom = atom(null, (get, set, loading: boolean) => {
  const currentState = get(quizStateAtom);
  set(quizStateAtom, {
    ...currentState,
    isLoading: loading,
  });
});

export const addQuizResultAtom = atom(
  null,
  (get, set, result: Omit<QuizResult, "completedAt">) => {
    const currentState = get(quizStateAtom);
    const newResult: QuizResult = {
      ...result,
      completedAt: new Date(),
    };

    set(quizStateAtom, {
      ...currentState,
      quizHistory: [...currentState.quizHistory, newResult],
      currentQuiz: null, // 퀴즈 완료 후 current 클리어
    });
  }
);

// 추천 곡 관련 액션 atoms
export const setCurrentSongAtom = atom(
  null,
  (get, set, song: Omit<SongRecommendation, "recommendedAt">) => {
    const currentState = get(songStateAtom);
    const newSong: SongRecommendation = {
      ...song,
      recommendedAt: new Date(),
    };

    set(songStateAtom, {
      ...currentState,
      currentSong: newSong,
      songHistory: [...currentState.songHistory, newSong],
      isLoading: false,
    });
  }
);

export const setSongLoadingAtom = atom(null, (get, set, loading: boolean) => {
  const currentState = get(songStateAtom);
  set(songStateAtom, {
    ...currentState,
    isLoading: loading,
  });
});

// 파생 atoms (읽기 전용)
export const currentQuizAtom = atom((get) => get(quizStateAtom).currentQuiz);
export const quizHistoryAtom = atom((get) => get(quizStateAtom).quizHistory);
export const isQuizLoadingAtom = atom((get) => get(quizStateAtom).isLoading);

export const currentSongAtom = atom((get) => get(songStateAtom).currentSong);
export const songHistoryAtom = atom((get) => get(songStateAtom).songHistory);
export const isSongLoadingAtom = atom((get) => get(songStateAtom).isLoading);

// 유틸리티 atoms
export const clearQuizDataAtom = atom(null, (get, set) => {
  set(quizStateAtom, {
    currentQuiz: null,
    quizHistory: [],
    isLoading: false,
  });
});

export const clearSongDataAtom = atom(null, (get, set) => {
  set(songStateAtom, {
    currentSong: null,
    songHistory: [],
    isLoading: false,
  });
});

// 최근 퀴즈 결과 가져오기
export const getRecentQuizResultAtom = atom((get) => {
  const history = get(quizHistoryAtom);
  return history.length > 0 ? history[history.length - 1] : null;
});

// 최근 추천 곡 가져오기
export const getRecentSongAtom = atom((get) => {
  const current = get(currentSongAtom);
  const history = get(songHistoryAtom);
  return current || (history.length > 0 ? history[history.length - 1] : null);
});

// 접근성 관련 atoms
export const isLargeTextModeAtom = atomWithStorage<boolean>(
  "isLargeTextMode",
  false,
  createJSONStorage(() => localStorage)
);
