import "./index.scss"

import { Outlet } from 'react-router-dom';
const IOT = () =>{
  return <>
    <div className="IOTRelease_parentContainer">
      <div className="IOTRelease_tableContainer">
        <Outlet/>
      </div>
    </div>
  
  
  
  </>
}

export default IOT