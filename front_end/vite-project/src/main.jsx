
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
//全局配置提供
import {ConfigProvider} from 'antd'
//引入antd的中文语言包
import zhCN from 'antd/es/locale/zh_CN'
//中文日期
import 'dayjs/locale/zh-cn'
createRoot(document.getElementById('root')).render(
   <ConfigProvider locale={zhCN}>
    <App/>
   </ConfigProvider>
)
