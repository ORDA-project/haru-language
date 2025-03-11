import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Navbar from "./Components/Templates/Navbar";
import Home from "./Components/Pages/Home";
import Question from "./Components/Pages/Question";
import Example from "./Components/Pages/Example";
import Introduction from "./Components/Pages/Introduction";
import Startlogin from "./Components/Pages/Startlogin";
import SongRecommend from "./Components/Pages/SongRecommend";
import Quiz from "./Components/Pages/Quiz";
import MyPage from "./Components/Pages/MyPage";

const router = createBrowserRouter([
  {
    path: "/home",
    element: <Home Login={true} />,
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
    element: <MyPage />
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
