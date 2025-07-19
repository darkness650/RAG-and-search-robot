import { useEffect, useState } from "react";
import "./iotDetails.css"
import { useNavigate } from 'react-router-dom';

const APP = () => {
  const [started, setStarted] = useState(false);
  // 新增：控制按钮是否显示（用于动画过渡）
  const navigate = useNavigate();
  const [buttonVisible, setButtonVisible] = useState(true);
  useEffect(() => {
    document.body.classList.add('iotdetails-hide-toggle');
    return () => {
      document.body.classList.remove('iotdetails-hide-toggle');
    };
  }, []);
  return (
    <>
      {/* 黑色遮罩和按钮 */}
      <div className={`iot-details-mask${started ? ' mask-fadeout' : ''}`}>
        {buttonVisible &&(
          <button  className={`iot-details-start-btn ${started ? 'btn-fadeout' : ''}`} onClick={() => {
            setStarted(true)
            
            setTimeout(() => {
              setButtonVisible(false);
            }, 1200); // 对应CSS中.btn-fadeout的transition: 1.2s
          
          
          }}>
            选择你想要对话的角色
          </button>
        )}
      </div>
      {/* 背景和内容，初始透明，动画渐现 */}
      <div className={`iot-details-bg${started ? ' bg-fadein' : ''}`}></div>
      <div className={`iot-details-content${started ? ' content-fadein' : ''}`}>
        <div className="activity-cards-demo">
          <div className="activity-card-demo">
            <div className="card-bg-img card-bg-img-one"></div>
            <svg className="cloud-top" viewBox="0 0 200 32" fill="none">
              <path d="M10 24 Q50 0 100 24 Q150 48 190 24" stroke="#e6d8b6" strokeWidth="4" fill="none"/>
              <path d="M30 20 Q60 10 100 20 Q140 30 170 20" stroke="#bfa76a" strokeWidth="2" fill="none"/>
              <path d="M60 28 Q100 8 140 28" stroke="#e6d8b6" strokeWidth="1.5" fill="none"/>
            </svg>
            <div className="activity-card-title-demo">角色一 <span className="seal">推荐</span></div>
            <div className="activity-card-date-demo">落于寒山的种子</div>
            <div className="activity-card-btn-demo" onClick={() =>navigate('/IOT/IOTDemoone')}>进入剧情</div>
          </div>
          <div className="activity-card-demo">
            <div className="card-bg-img card-bg-img-two"></div>
            <svg className="cloud-top" viewBox="0 0 200 32" fill="none">
              <path d="M10 24 Q50 0 100 24 Q150 48 190 24" stroke="#e6d8b6" strokeWidth="4" fill="none"/>
              <path d="M30 20 Q60 10 100 20 Q140 30 170 20" stroke="#bfa76a" strokeWidth="2" fill="none"/>
              <path d="M60 28 Q100 8 140 28" stroke="#e6d8b6" strokeWidth="1.5" fill="none"/>
            </svg>
            <div className="activity-card-title-demo">角色二 <span className="seal">限时</span></div>
            <div className="activity-card-date-demo">神封清净天</div>
            <div className="activity-card-btn-demo" onClick={() =>navigate('/IOT/IOTDemotwo')}>进入剧情</div>
          </div>
          <div className="activity-card-demo">
            <div className="card-bg-img card-bg-img-three"></div>
            <svg className="cloud-top" viewBox="0 0 200 32" fill="none">
              <path d="M10 24 Q50 0 100 24 Q150 48 190 24" stroke="#e6d8b6" strokeWidth="4" fill="none"/>
              <path d="M30 20 Q60 10 100 20 Q140 30 170 20" stroke="#bfa76a" strokeWidth="2" fill="none"/>
              <path d="M60 28 Q100 8 140 28" stroke="#e6d8b6" strokeWidth="1.5" fill="none"/>
            </svg>
            <div className="activity-card-title-demo">角色三 <span className="seal">热门</span></div>
            <div className="activity-card-date-demo">兰陵梦中人</div>
            <div className="activity-card-btn-demo" onClick={() =>navigate('/IOT/IOTDemothree')}>进入剧情</div>
          </div>
          <div className="activity-card-demo">
            <div className="card-bg-img card-bg-img-four"></div>
            <svg className="cloud-top" viewBox="0 0 200 32" fill="none">
              <path d="M10 24 Q50 0 100 24 Q150 48 190 24" stroke="#e6d8b6" strokeWidth="4" fill="none"/>
              <path d="M30 20 Q60 10 100 20 Q140 30 170 20" stroke="#bfa76a" strokeWidth="2" fill="none"/>
              <path d="M60 28 Q100 8 140 28" stroke="#e6d8b6" strokeWidth="1.5" fill="none"/>
            </svg>
            <div className="activity-card-title-demo">角色四 <span className="seal">新</span></div>
            <div className="activity-card-date-demo">花月痕</div>
            <div className="activity-card-btn-demo"onClick={() =>navigate('/IOT/IOTDemofour')}>进入剧情</div>
          </div>
        </div>
      </div>
    </>
  )
}

export default APP;