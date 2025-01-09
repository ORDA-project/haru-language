import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Navbar from "./Components/Templates/Navbar";
import Home from "./Components/Pages/Home";
import Question from "./Components/Pages/Question";
import Example from "./Components/Pages/Example";
import Introduction from "./Components/Pages/Introduction";
import Startlogin from "./Components/Pages/Startlogin";
import SongRecommend from "./Components/Pages/SongRecommend";

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
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
