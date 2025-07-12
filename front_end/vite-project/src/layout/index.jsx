import { Suspense, useMemo, useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Layout, Menu, ConfigProvider, Tooltip } from "antd";
import { ArrowRightOutlined, ArrowLeftOutlined, ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import routes from "@/routes";
import "./index.scss";

const { Header, Sider, Content } = Layout;

export default function BasicLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn] = useState(sessionStorage.getItem('auth_token') !== null);
  
  // 侧边栏状态
  const [showSider, setShowSider] = useState(false);
  
  // 顶部导航栏状态
  const [showHeader, setShowHeader] = useState(false);

  // 切换侧边栏显示状态
  const toggleSider = () => {
    setShowSider(!showSider);
  };

  // 切换顶部导航栏显示状态
  const toggleHeader = () => {
    setShowHeader(!showHeader);
  };

  // 生成菜单项
  const menuItems = useMemo(() =>
    routes[0]?.children
      ?.filter(route => !route.hidden)
      .map(route => ({
        key: route.path,
        label: <Link to={route.path}>{route.title}</Link>,
        disabled: !isLoggedIn && route.requiresLogin 
      })) || [],
    [isLoggedIn]
  );

  const menuHighLightArr = useMemo(() =>
    routes[0]?.children?.map(v => v.path) || [],
  []);

  const selectedKeys = useMemo(() => {
    const path = location.pathname;
    return menuHighLightArr.find(res => path.startsWith(`/${res}`));
  }, [location.pathname, menuHighLightArr]);

  // 在组件内加上chatHistory的useState定义，防止未定义报错
  const [chatHistory] = useState([
    { role: 'user', content: '你好，AI！' },
    { role: 'ai', content: '你好，有什么可以帮您？' },
    { role: 'user', content: '帮我写个React代码' },
    { role: 'ai', content: '好的，代码如下...' }
  ]);
  // 假设 chatHistory 在组件内已定义
  const userQuestions = chatHistory ? chatHistory.filter(msg => msg.role === 'user') : [];
  // 1. 在组件顶部添加历史高亮状态
  const [selectedHistoryKey, setSelectedHistoryKey] = useState(null);
  // 生成历史记录菜单项时，不加label里的style
  const historyMenuItems = userQuestions.map((msg, idx) => ({
    key: `history-${idx}`,
    label: (
      <span>
        <b>Q：</b>
        {msg.content.length > 12 ? msg.content.slice(0, 12) + '...' : msg.content}
      </span>
    ),
    onClick: () => setSelectedHistoryKey(`history-${idx}`)
  }));
  const allMenuItems = [
    ...menuItems,
    { type: 'divider' },
    {
      type: 'group',
      label: '历史提问',
      children: historyMenuItems
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', minWidth: '100vw' }}>
      {/* 顶部导航栏 */}
      <Header 
        className={`header ${showHeader ? 'header-visible' : 'header-hidden'}`}
      >
        <div className="logo" onClick={() => navigate("/")} />
        <div className="right-area">
          <div className="right-title">这是一个神奇的海螺吆</div>
        </div>
      </Header>
      
      <Layout>
        {/* 侧边栏 */}
        <Sider 
          width={200}
          theme="light"
          className={`${showSider ? 'sider-visible' : 'sider-hidden'}`}
        >
          <Menu
            selectedKeys={selectedHistoryKey ? [selectedHistoryKey] : [selectedKeys || ""]}
            mode="inline"
            items={allMenuItems}
            onClick={({ key }) => {
              if (key.startsWith('history-')) {
                setSelectedHistoryKey(key);
              } else {
                setSelectedHistoryKey(null);
              }
            }}
          />
        </Sider>
        
        {/* 侧边栏控制按钮 - 固定在左侧中间位置 */}
        <div 
          className="sider-toggle"
          onClick={toggleSider}
        >
          <Tooltip title={showSider ? "收起侧边栏" : "展开侧边栏"}>
            {showSider ? <ArrowLeftOutlined className="toggle-icon" /> : <ArrowRightOutlined className="toggle-icon" />}
          </Tooltip>
        </div>
        
        <Content 
          style={{ 
            margin: '0px',
            backgroundColor: '#f0f0f0',
            padding: '0px',
            transition: 'margin-left 0.3s ease' 
          }}
        >
          {/* 顶部导航栏控制按钮 - 固定在内容区域顶部中间 */}
          <div 
            className="header-toggle"
            onClick={toggleHeader}
          >
            <Tooltip title={showHeader ? "收起导航栏" : "展开导航栏"}>
              {showHeader ? <ArrowUpOutlined className="toggle-icon" /> : <ArrowDownOutlined className="toggle-icon" />}
            </Tooltip>
          </div>
          
          <ConfigProvider
            renderEmpty={() => (
              <div style={{ padding: 24, background: '#f8f8f8' }}>
                暂无数据
              </div>
            )}
          >
            <Suspense fallback={<div>正在加载哦稍等</div>}>
              <Outlet />
            </Suspense>
          </ConfigProvider>
        </Content>
      </Layout>
    </Layout>
  );
}