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
import ErrorBoundary from "./Components/Elements/ErrorBoundary";
import ErrorProvider from "./Components/Providers/ErrorProvider";

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
], {
  basename: import.meta.env.PROD ? "/haru-language" : "/"
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider>
        <ErrorBoundary>
          <ErrorProvider>
            <RouterProvider router={router} />
          </ErrorProvider>
        </ErrorBoundary>
      </Provider>
    </QueryClientProvider>
  );
}

export default App;
