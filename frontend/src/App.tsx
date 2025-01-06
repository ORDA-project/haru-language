import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Navbar from "./Components/Templates/Navbar";
import Home from "./Components/Pages/Home"
import Question from "./Components/Pages/Question";

const router = createBrowserRouter([
  {
    path: "/Navbar",
    element: <Navbar />,
  },
  {
    path: "/",
    element: <Home />
  },
  {
    path: "/Question",
    element: <Question />,
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
