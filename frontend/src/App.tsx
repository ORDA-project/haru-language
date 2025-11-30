import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Provider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from "./Components/Templates/Navbar";
import Home from "./Components/Pages/Home";
import Question from "./Components/Pages/Question";
import Example from "./Components/Pages/Example";
import Introduction from "./Components/Pages/Introduction";
import Startlogin from "./Components/Pages/Startlogin";
import SongRecommend from "./Components/Pages/SongRecommend";
import Quiz from "./Components/Pages/Quiz";
import MyPage from "./Components/Pages/MyPage";
import UserProfileEdit from "./Components/Pages/UserProfileEdit";
import DailySentence from "./Components/Pages/DailySentence";
import Announcements from "./Components/Pages/Announcements";
import PrivacyPolicy from "./Components/Pages/PrivacyPolicy";
import TermsOfService from "./Components/Pages/TermsOfService";
import VersionInfo from "./Components/Pages/VersionInfo";
import QuestionDetail from "./Components/Pages/QuestionDetail";
import AuthCallback from "./Components/Pages/AuthCallback";
import ErrorBoundary from "./Components/Elements/ErrorBoundary";
import ErrorProvider from "./Components/Providers/ErrorProvider";
import FriendNotificationListener from "./Components/Elements/FriendNotificationListener";
import FriendInvite from "./Components/Pages/FriendInvite";
import Season from "./Components/Pages/Season";
import DeleteAccount from "./Components/Pages/DeleteAccount";

const router = createBrowserRouter([
  {
    path: "/home",
    element: <Home />,
  },
  {
    path: "/question",
    element: <Question />,
  },
  {
    path: "/example",
    element: <Example />,
  },
  {
    path: "/introduction",
    element: <Introduction />,
  },
  {
    path: "/",
    element: <Startlogin />,
  },
  {
    path: "/song-recommend",
    element: <SongRecommend />,
  },
  {
    path: "/quiz",
    element: <Quiz />,
  },
  {
    path: "/mypage",
    element: <MyPage />,
  },
  {
    path: "/mypage/edit",
    element: <UserProfileEdit />,
  },
  {
    path: "daily-sentence",
    element: <DailySentence />,
  },
  {
    path: "/announcements",
    element: <Announcements />,
  },
  {
    path: "/privacy-policy",
    element: <PrivacyPolicy />,
  },
  {
    path: "/terms-of-service",
    element: <TermsOfService />,
  },
  {
    path: "/version-info",
    element: <VersionInfo />,
  },
  {
    path: "/question-detail/:date",
    element: <QuestionDetail />,
  },
  {
    path: "/auth/google/callback",
    element: <AuthCallback />,
  },
  {
    path: "/auth/kakao/callback",
    element: <AuthCallback />,
  },
  {
    path: "/invite",
    element: <FriendInvite />,
  },
  {
    path: "/season",
    element: <Season />,
  },
  {
    path: "/delete-account",
    element: <DeleteAccount />,
  },
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// ReactQueryDevtools는 개발 환경에서만 로드
const ReactQueryDevtools = import.meta.env.DEV
  ? React.lazy(() =>
      import("@tanstack/react-query-devtools").then((mod) => ({
        default: mod.ReactQueryDevtools,
      }))
    )
  : null;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider>
        <ErrorBoundary>
          <ErrorProvider>
            <FriendNotificationListener />
            <RouterProvider router={router} />
          </ErrorProvider>
        </ErrorBoundary>
      </Provider>
      {import.meta.env.DEV && ReactQueryDevtools && (
        <React.Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </React.Suspense>
      )}
    </QueryClientProvider>
  );
}

export default App;
