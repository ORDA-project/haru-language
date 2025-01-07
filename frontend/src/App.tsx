import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Navbar from "./Components/Templates/Navbar";
import Home from "./Components/Pages/Home";
import Question from "./Components/Pages/Question";
import Example from "./Components/Pages/Example";
import Introduction from "./Components/Pages/Introduction";

const router = createBrowserRouter([
  {
    path: "/Navbar",
    element: <Navbar />,
  },
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/Question",
    element: <Question />,
  },
  {
    path: "/Example",
    element: <Example />,
  },
  {
    path: "/Introduction",
    element: <Introduction />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
