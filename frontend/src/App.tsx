import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./App.css";
import Navbar from "./Pages/Navbar";
import Home from "./Pages/Home"
import Question from "./Pages/Question";

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
