import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./App.css";
import Navbar from "./Components/Templates/Navbar";
import Home from "./Components/Pages/Home";
import Question from "./Components/Pages/Question";
import Example from "./Components/Pages/Example";

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
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
