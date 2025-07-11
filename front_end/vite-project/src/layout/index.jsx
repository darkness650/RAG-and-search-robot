//这个文档主要实现的内容是关于路由的配置的内容，最外层的layout的配置，目前可以访问到该配置了

//响应过程中需要加载的 ，以及缓存的hook，不用的时候不需要改变
import { Suspense,useMemo } from "react";
import{Outlet,Link,useLocation,useNavigate}from
'react-router-dom';

import{Layout,Menu,ConfigProvider}from 'antd';
import routes from"@/routes";
import "./index.scss";
//layout作用是划分区域。
const {Header,Sider,Content}=Layout;

export default function BasicLayout(){
  const location = useLocation();
  const navigate = useNavigate();
  
  
  const isLoggedIn = sessionStorage.getItem('auth_token') !== null;

  // 生成菜单项，根据登录状态和requiresLogin属性禁用菜单项
  const menuItems = useMemo(() =>
    routes[0]?.children
      ?.filter(route => !route.hidden) // 过滤掉标记为隐藏的路由
      .map(route => ({
        key: route.path,
        label: <Link to={route.path}>{route.title}</Link>,
        // 未登录且路由需要登录时禁用
        disabled: !isLoggedIn && route.requiresLogin 
      })) || [],
    [isLoggedIn] // 登录状态变化时重新生成菜单
  );
  //设置高亮数组，需要得知每一个路径的位置
  const menuHighLightArr = useMemo(()=>
    routes[0]?.children?.map(v=>v.path)||[],
  []
  );

  //通过这个函数得到选择的关键词，从而在后续把他高亮
   const selectedKeys = useMemo(()=>{
    const path =location.pathname;
    const items = menuHighLightArr.find(res => path.startsWith(`/${res}`))//find函数找到这个高亮的位置，从而把他输出出去
    return items;
   },[location.pathname,menuHighLightArr]);
   //缓存修改是在路由状态发生变化或者你访问的网站发生变化时侯才可以改变

   return(
    <Layout style={{minHeight:'100vh',
                    minWidth:'100vw'
    }}>
      <Header 
        // style={{height:'0px'}}
      className="header">
       <div className="logo" onClick={() =>
        navigate("/")
       }>
        </div>
        <div className="right-area">
        <div className="right-title">这是一个神奇的海螺吆 </div>
         </div>
        
        

      </Header>
      <Layout     >
        
        <Sider width="15.1%"
         theme="light">
          <Menu
            selectedKeys={[selectedKeys || " "]}
            mode = "inline"
            items = {menuItems}
           />
          </Sider>
      <Content style={{margin:'0px',
                       backgroundColor: '#f0f0f0',
                       padding:'0px'}}
                       >
          <ConfigProvider
            //下面这个本来是一个属性，用于没有东西的时候应该是什么，也可以用这个函数来确定在没东西时候返回什么
            renderEmpty={() =>(
              <div style={{ padding:24,
                            background:'#f8f8f8'}}>
                暂无数据
              </div>
            )}
          >
            <Suspense fallback = {<div>正在加载哦稍等</div>}>
               <Outlet/>
            </Suspense>
          </ConfigProvider>
        </Content>
       </Layout>
   </Layout>
   )
}