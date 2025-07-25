import { Suspense, useMemo, useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Layout, Menu, ConfigProvider, Tooltip } from "antd";
import { ArrowRightOutlined, ArrowLeftOutlined, ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import routes from "@/routes";
import "./index.scss";
import { Modal, Input, message, Dropdown } from "antd";
import { useRef } from "react";
import { EditOutlined, MoreOutlined, StarOutlined, StarFilled } from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

export default function BasicLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 侧边栏状态
  const [showSider, setShowSider] = useState(true);
  
  // 顶部导航栏状态
  const [showHeader, setShowHeader] = useState(true);

  // 历史记录相关状态
  const [chatList, setChatList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryKey, setSelectedHistoryKey] = useState(null);

  // 布局模式状态
  const [layoutMode, setLayoutMode] = useState('normal'); // 'normal' | 'fullscreen'

  // 侧边栏宽度
  const siderWidth = 200;
  // 计算偏移量
  const siderOffset = showSider ? siderWidth : 0;

  // 重命名相关状态
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null); // {chat_id, chat_name}
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef();

  // 右键历史记录项，弹出重命名Modal
  const handleHistoryRightClick = (chat) => {
    setRenameTarget(chat);
    setRenameValue(chat.chat_name);
    setRenameModalVisible(true);
    setTimeout(() => {
      if (renameInputRef.current) renameInputRef.current.focus();
    }, 100);
  };
    
  // 提交重命名
  const handleRenameOk = async () => {
    if (!renameValue.trim()) {
      message.error("名称不能为空");
      return;
    }
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      console.log({
        url: 'http://localhost:8080/chat_list/rename',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: renameTarget.chat_id,
          new_name: renameValue.trim()
        })
      });

      const res = await fetch('http://localhost:8080/chat_list/rename', {
       
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: String(renameTarget.chat_id), // 强制转字符串
          new_name: renameValue.trim()
        })
      });
      if (!res.ok) throw new Error("重命名失败");
      message.success("重命名成功");
      setRenameModalVisible(false);
      setRenameTarget(null);
      setRenameValue("");
      fetchChatList(); // 刷新历史记录
    } catch (e) {
      message.error(e.message || "重命名失败");
    }
  };

  // 取消重命名
  const handleRenameCancel = () => {
    setRenameModalVisible(false);
    setRenameTarget(null);
    setRenameValue("");
  };

  // 新增：删除弹窗的受控状态
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // 打开删除弹窗
  const handleDeleteChat = (chat) => {
    setDeleteTarget(chat);
    setDeleteModalVisible(true);
  };

  // 确认删除
  const handleDeleteOk = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const res = await fetch('http://localhost:8080/chat_list/delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: String(deleteTarget.chat_id),
        })
      });
      if (!res.ok) throw new Error("删除失败");
      message.success("删除成功");
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      fetchChatList();
    } catch (e) {
      message.error(e.message || "删除失败");
    }
  };

  // 取消删除
  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setDeleteTarget(null);
  };

  // 收藏弹窗受控状态
  const [starModalVisible, setStarModalVisible] = useState(false);
  const [starTarget, setStarTarget] = useState(null);
  const [starAction, setStarAction] = useState(true); // true: 收藏, false: 取消收藏

  // 打开收藏弹窗
  const handleStarChat = (chat) => {
    setStarTarget(chat);
    setStarAction(!chat.is_starred);
    setStarModalVisible(true);
  };

  // 确认收藏/取消收藏
  const handleStarOk = async () => {
    if (!starTarget) return;
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const res = await fetch('http://localhost:8080/chat_list/star', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: String(starTarget.chat_id),
          starred: starAction
        })
      });
      if (!res.ok) throw new Error("操作失败");
      message.success(starAction ? "收藏成功" : "已取消收藏");
      setStarModalVisible(false);
      setStarTarget(null);
      fetchChatList();
    } catch (e) {
      message.error(e.message || "操作失败");
    }
  };

  // 取消收藏弹窗
  const handleStarCancel = () => {
    setStarModalVisible(false);
    setStarTarget(null);
  };

  // 根据showSider给body加/去掉sider-collapsed类，实现底部输入框联动左移
  useEffect(() => {
    if (!showSider) {
      document.body.classList.add('sider-collapsed');
    } else {
      document.body.classList.remove('sider-collapsed');
    }
    // 清理函数，防止多页面切换遗留
    return () => {
      document.body.classList.remove('sider-collapsed');
    };
  }, [showSider]);

  // 检查登录状态
  const checkLoginStatus = () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const isLoggedInNow = !!token;
    setIsLoggedIn(isLoggedInNow);
    // 只负责登录状态，不再重置Header/Sider
    setLayoutMode('normal');
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

  // 监听token内容变化，token变为非空且变化时3秒后刷新历史记录
  const [currentToken, setCurrentToken] = useState(
    localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || ''
  );

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
      setCurrentToken(token);
    };
    window.addEventListener('storage', checkToken);
    const interval = setInterval(checkToken, 1000); // 防止同页面切换
    return () => {
      window.removeEventListener('storage', checkToken);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (currentToken) {
      const timer = setTimeout(() => {
        fetchChatList();
      }, 500); // 由3000改为2000
      return () => clearTimeout(timer);
    }
    // token为空时不刷新
  }, [currentToken]);

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
      const res = await fetch('http://localhost:8080/chat_list/user', {
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

  // 登录后只延迟3秒刷新一次历史记录
  useEffect(() => {
    if (isLoggedIn) {
      const timer = setTimeout(() => {
        fetchChatList();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  // 监听登录状态变化，登录后自动收起Header和Sider
  useEffect(() => {
    if (isLoggedIn) {
      setShowHeader(false);
      setShowSider(false);
    }
  }, [isLoggedIn]);

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
        label: (
          <div
            className="history-item-label"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {chat.is_starred
                ? <StarFilled style={{color: '#faad14', marginRight: 4}} />
                : <span style={{marginRight: 4}}>💬</span>
              }
              {chat.chat_name.length > 15 ? chat.chat_name.slice(0, 15) + '...' : chat.chat_name}
            </span>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'star',
                    icon: chat.is_starred ? <StarFilled style={{color: '#faad14'}} /> : <StarOutlined />,
                    label: chat.is_starred ? '取消收藏' : '收藏',
                    onClick: () => handleStarChat(chat)
                  },
                  {
                    key: 'rename',
                    icon: <EditOutlined />, 
                    label: '重命名',
                    onClick: () => handleHistoryRightClick(chat)
                  },
                  {
                    key: 'delete',
                    danger: true,
                    icon: <span style={{color: 'red'}}>&#128465;</span>,
                    label: '删除',
                    onClick: () => handleDeleteChat(chat)
                  }
                ]
              }}
              trigger={['click']}
            >
              <span className="history-action-icon" style={{ marginLeft: 8, cursor: 'pointer' }} onClick={e => e.stopPropagation()}>
                <MoreOutlined />
              </span>
            </Dropdown>
          </div>
        )
      }));

  // 合并菜单项
  const allMenuItems = [
    ...menuItems,
    { type: 'divider' },
    ...historyMenuItems
  ];

  // 新增：直接用路由判断是否为 iotDetails 或 demo 系列页面
  const isIotDetails = /iotdetails|demo/i.test(location.pathname);

  // 判断是否需要隐藏按钮（只在iotDetails页面隐藏）
  const hideSiderToggle = isIotDetails;

  // 路由变化时，强制隐藏Header和Sider
  useEffect(() => {
    if (isIotDetails) {
      setShowHeader(false);
      setShowSider(false);
    }
  }, [location.pathname, isIotDetails]);

  // 退出登录逻辑
  const handleLogout = async () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8080/logout/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('退出登录失败');
      // 清除本地 token
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      // 跳转到登录页
      navigate('/');
    } catch (e) {
      // 可选：提示错误
      alert(e.message || '退出登录失败');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', minWidth: '100vw' }}>
      {/* 顶部导航栏 - 只在非iotDetails页面渲染 */}
      {!isIotDetails && (
        layoutMode === 'normal' && (
          <Header className={`header${showHeader ? '' : ' header-hidden'}`}>
            <div className="logo" onClick={() => navigate("/IOTDetails")} />
            <div 
              className="right-area"
              style={{
                left: `calc(50% + ${showSider ? 200 / 2 : 0}px)`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="right-title">这是一个神奇的海螺吆</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>退出</button>
          </Header>
        )
      )}
      {/* header-toggle按钮始终固定在顶部中间，受侧边栏影响右移 */}
      {!isIotDetails && layoutMode === 'normal' && !hideSiderToggle && (
        <div 
          className="header-toggle fixed-header-toggle"
          style={{
            left: `calc(50% + ${showSider ? 200 / 2 : 0}px)`,
            transform: 'translateX(-50%)'
          }}
          onClick={toggleHeader}
        >
          <Tooltip title={showHeader ? "收起导航栏" : "展开导航栏"}>
            {showHeader ? <ArrowUpOutlined className="toggle-icon" /> : <ArrowDownOutlined className="toggle-icon" />}
          </Tooltip>
        </div>
      )}
      <Layout>
        {/* 侧边栏 - 只在非iotDetails页面渲染 */}
        {!isIotDetails && (
          <Sider 
            width={200}
            theme="light"
            collapsible
            collapsed={!showSider}
            collapsedWidth={0}
            trigger={null}
          >
            <Menu
              selectedKeys={selectedHistoryKey ? [selectedHistoryKey] : [selectedKeys || ""]}
              mode="inline"
              items={menuItems}
              onClick={async ({ key }) => {
                if (key === 'environmentManage') {
                  // 新对话逻辑：先请求chatId再跳转
                  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
                  try {
                    const res = await fetch('http://localhost:8080/ai/newchat', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const chatId = res.headers.get("X-Chat-Id");
                    // 跳转并传递chatId
                    navigate('/environmentManage', { state: { chatId } });
                    // 强制刷新历史列表
                    await fetchChatList();
                    // 高亮新对话
                    setSelectedHistoryKey('chat-' + chatId);
                  } catch (e) {
                    // 失败时也跳转但不带chatId
                    navigate('/environmentManage');
                  }
                } else if (key.startsWith('chat-')) {
                  setSelectedHistoryKey(key);
                  // 从key中提取chat_id
                  const chatId = key.replace('chat-', ''); // 保证chat_id为字符串
                  const chat = chatList.find(c => String(c.chat_id) === chatId);
                  if (chat) {
                    navigate('/environmentManage', { 
                      state: { 
                        chatId: chat.chat_id,
                        chatName: chat.chat_name
                      } 
                    });
                  }
                } else {
                  setSelectedHistoryKey(null);
                }
              }}
            />
            <div style={{fontWeight: 'bold', fontSize: 16, padding: '12px 16px 4px 16px', background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 2}}>历史记录</div>
            <div className="sider-history-scroll">
              <Menu
                selectedKeys={selectedHistoryKey ? [selectedHistoryKey] : [selectedKeys || ""]}
                mode="inline"
                items={historyMenuItems}
                onClick={async ({ key }) => {
                  if (key.startsWith('chat-')) {
                    setSelectedHistoryKey(key);
                    const chatId = key.replace('chat-', '');
                    const chat = chatList.find(c => String(c.chat_id) === chatId);
                    if (chat) {
                      navigate('/environmentManage', { 
                        state: { 
                          chatId: chat.chat_id,
                          chatName: chat.chat_name
                        } 
                      });
                    }
                  }
                }}
              />
            </div>
            {/* 重命名Modal */}
            <Modal
              title="重命名会话"
              open={renameModalVisible}
              onOk={handleRenameOk}
              onCancel={handleRenameCancel}
              okText="确定"
              cancelText="取消"
            >
              <Input
                ref={renameInputRef}
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onPressEnter={handleRenameOk}
                maxLength={30}
                placeholder="请输入新名称"
              />
            </Modal>
            {/* 删除Modal */}
            <Modal
              title={deleteTarget ? `确定要删除"${deleteTarget.chat_name}"吗？` : '确定要删除吗？'}
              open={deleteModalVisible}
              onOk={handleDeleteOk}
              onCancel={handleDeleteCancel}
              okText="删除"
              okType="danger"
              cancelText="取消"
            >
              <div>删除后不可恢复，是否继续？</div>
            </Modal>
            {/* 收藏/取消收藏Modal */}
            <Modal
              title={starTarget ? (starAction ? `确定要收藏"${starTarget.chat_name}"吗？` : `确定要取消收藏"${starTarget.chat_name}"吗？`) : '操作确认'}
              open={starModalVisible}
              onOk={handleStarOk}
              onCancel={handleStarCancel}
              okText={starAction ? "收藏" : "取消收藏"}
              okType={starAction ? "primary" : "default"}
              cancelText="取消"
            >
              <div>{starAction ? '收藏后可在历史记录中快速找到该会话。' : '取消收藏后该会话将不再置顶。'}</div>
            </Modal>
          </Sider>
        )}
        {/* 侧边栏控制按钮 - 只在非iotDetails页面渲染 */}
        {!isIotDetails && !hideSiderToggle && (
          <div 
            className="sider-toggle"
            onClick={toggleSider}
          >
            <Tooltip title={showSider ? "收起侧边栏" : "展开侧边栏"}>
              {showSider ? <ArrowLeftOutlined className="toggle-icon" /> : <ArrowRightOutlined className="toggle-icon" />}
            </Tooltip>
          </div>
        )}
        <Content 
          style={{ 
            margin: '0px',
            backgroundColor: '#f0f0f0',
            padding: '0px',
            transition: 'margin-left 0.3s ease',
            position: 'relative',
            // marginLeft: isIotDetails ? 0 : (showSider ? 200 : 0)
          }}
        >
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