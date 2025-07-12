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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 侧边栏状态
  const [showSider, setShowSider] = useState(false);
  
  // 顶部导航栏状态
  const [showHeader, setShowHeader] = useState(false);

  // 历史记录相关状态
  const [chatList, setChatList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryKey, setSelectedHistoryKey] = useState(null);

  // 检查登录状态
  const checkLoginStatus = () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    setIsLoggedIn(!!token);
  };

  // 监听登录状态变化
  useEffect(() => {
    checkLoginStatus();
    
    // 监听storage变化（当token被设置或删除时）
    const handleStorageChange = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 定期检查登录状态（每5秒检查一次）
    const interval = setInterval(checkLoginStatus, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // 切换侧边栏显示状态
  const toggleSider = () => {
    setShowSider(!showSider);
  };

  // 切换顶部导航栏显示状态
  const toggleHeader = () => {
    setShowHeader(!showHeader);
  };

  // 获取历史对话列表
  const fetchChatList = async () => {
    if (historyLoading) return;
    
    console.log('开始获取历史记录，当前登录状态:', isLoggedIn);
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      console.log('当前token:', token ? '存在' : '不存在');
      
      if (!token) {
        console.log('没有token，清空历史列表');
        setChatList([]);
        return;
      }
      
      console.log('开始调用API获取历史列表...');
      // TODO: 替换为你的API地址
      const res = await fetch('http://10.158.36.225:8080/chat_list/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API响应状态:', res.status);
      if (!res.ok) {
        throw new Error(`获取聊天列表失败: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('获取到的历史记录数据:', data);
      setChatList(data);
      
    } catch (e) {
      console.error('加载聊天列表失败:', e);
      // API失败时保持空列表，不显示测试数据
      setChatList([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 监听登录状态变化，登录后重新获取历史列表
  useEffect(() => {
    console.log('登录状态变化，当前状态:', isLoggedIn);
    if (isLoggedIn) {
      console.log('用户已登录，开始获取历史记录');
      fetchChatList();
    } else {
      console.log('用户未登录，清空历史列表');
      // 未登录时清空历史列表
      setChatList([]);
      setSelectedHistoryKey(null);
    }
  }, [isLoggedIn]); // 依赖isLoggedIn状态

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

  // 生成历史记录菜单项
  const historyMenuItems = historyLoading 
    ? [{ key: 'loading', label: '加载聊天列表中...', disabled: true }]
    : chatList.map((chat) => ({
        key: `chat-${chat.chat_id}`,
        label: `💬 ${chat.chat_name.length > 15 ? chat.chat_name.slice(0, 15) + '...' : chat.chat_name}`
      }));

  // 合并菜单项
  const allMenuItems = [
    ...menuItems,
    { type: 'divider' },
    ...historyMenuItems
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
              console.log('菜单点击事件触发，key:', key);
              if (key.startsWith('chat-')) {
                console.log('匹配到历史记录，准备跳转');
                setSelectedHistoryKey(key);
                // 从key中提取chat_id
                const chatId = parseInt(key.replace('chat-', ''));
                console.log('提取的chatId:', chatId);
                console.log('当前chatList:', chatList);
                console.log('chatList第一个元素:', chatList[0]);
                console.log('chatList中chat_id的类型:', typeof chatList[0]?.chat_id);
                console.log('提取的chatId类型:', typeof chatId);
                const chat = chatList.find(c => c.chat_id === chatId);
                console.log('找到的chat:', chat);
                if (chat) {
                  console.log('找到聊天记录，跳转到:', chat.chat_name);
                  navigate('/environmentManage', { 
                    state: { 
                      chatId: chat.chat_id,
                      chatName: chat.chat_name
                    } 
                  });
                } else {
                  console.log('没有找到匹配的聊天记录');
                }
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