//路由
import { RouterProvider } from "react-router-dom";
import { createBrowserRouter } from "react-router-dom";
import routes from "./routes/index";
function App(){
  const routers=createBrowserRouter(routes);
  return<RouterProvider router={routers}/>
}
export default App;