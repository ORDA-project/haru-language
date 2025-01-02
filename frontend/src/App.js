import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./App.css";
import Navbar from "./Pages/Navbar";
import Home from "./Pages/Home"


const router = createBrowserRouter([
  {
    path: "/Navbar",
    element: <Navbar />,
  },
  {
    path: "/",
    element: <Home />
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;