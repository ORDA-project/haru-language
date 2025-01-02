import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./App.css";
import Navbar from "./Pages/Navbar";


const router = createBrowserRouter([
  {
    path: "/Navbar",
    element: <Navbar />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;