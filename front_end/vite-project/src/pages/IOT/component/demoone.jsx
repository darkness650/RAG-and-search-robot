import { useEffect, useRef, useState } from "react";
import { useLocation } from 'react-router-dom';
import "./demoone.css";



const openingText = "  凌霜妃，南楚王的宠妃，出身江南名门世家，自幼修习琴艺与剑术，优雅端庄、清冷高贵。";

const DemoOne = () => {
  const location = useLocation();
  const [messages, setMessages] = useState([
    {
      type: "ai",
      content:'欢迎来到红绡仙的异世界',
      // timeStamp:new Date().toLocaleTimeString()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState(() => {
   
   
    return location.state?.chatId || localStorage.getItem('current_chat_id') || null;
  });
  const [historyList, setHistoryList] = useState([]);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // 新增开场动画相关状态
  const [visibleCount, setVisibleCount] = useState(0);
  const [opening, setOpening] = useState(true); // true=黑幕动画中，false=主内容
  const [showButton, setShowButton] = useState(true);
  const typingTimer = useRef(null);

  // 打字机动画
  useEffect(() => {
    setVisibleCount(0);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (opening) {
      const type = () => {
        setVisibleCount(count => {
          if (count < openingText.length) {
            typingTimer.current = setTimeout(type, 100);
            return count + 1;
          }
          return count;
        });
      };
      type();
    }
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [opening]);

  // 继续按钮点击
  const handleStart = () => {
    setShowButton(false);
    setTimeout(() => {
      setOpening(false);
    }, 1200); // 与css动画时长一致
    
  };

  // 每次消息更新都滚动到底部
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 自动聚焦输入框
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages]);

  // 保存chatId到localStorage
  useEffect(() => {
    if (chatId) {
      localStorage.setItem('current_chat_id', chatId);
    } else {
      localStorage.removeItem('current_chat_id');
    }
  }, [chatId]);

  // // 页面加载时，如果没有 chatId，主动向后端请求一个新的 chatId
  // useEffect(() => {
  //   if (!chatId) {
  //     const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  //     fetch('http://10.158.36.225:8080/ai/new_chat_id', {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       }
  //     })
  //       .then(res => res.json())
  //       .then(data => {
  //         if (data && data.chat_id) {
  //           setChatId(String(data.chat_id));
  //           localStorage.setItem('current_chat_id', String(data.chat_id));
  //         }
  //       })
  //       .catch(() => {});
  //   }
  // }, []);

  // 拉取历史列表函数，供多处调用
  const fetchHistoryList = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const res = await fetch('http://10.158.36.225:8080/chat_list/role1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('获取历史列表失败');
      const data = await res.json();
      setHistoryList(data || []);
    } catch (e) {
      setHistoryList([]);
    }
  };

  // // 拉取历史列表（和environmentManage一致）
  // useEffect(() => {
  //   async function fetchHistoryList() {
  //     try {
  //       const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  //       const res = await fetch('http://10.158.36.225:8080/ai/', {
  //         method: 'GET',
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //           'Content-Type': 'application/json'
  //         }
  //       });
  //       if (!res.ok) throw new Error('获取历史列表失败');
  //       const data = await res.json();
  //       setHistoryList(data || []);
  //     } catch (e) {
  //       setHistoryList([]);
  //     }
  //   }
  //   fetchHistoryList();
  // }, []);
  
  // const handleNewChat = async () => {
  //   const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  
  //   try {
  //     // 1. 创建新会话，注意 URL 是 /newchat（没有 model 参数）
  //     const createChatRes = await fetch('http://10.158.36.225:8080/ai/newchat', {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type':'application/json'
  //       }
        
  //     });
  //     // const  data = await createChatRes.json();
  //     const chatId = createChatRes.headers.get("X-Chat-Id");
  //     if (!chatId) throw new Error("未能获取 chat_id");
  
  //     // 2. 存储 chat_id
  //     setChatId(String(chatId));
  //     localStorage.setItem("current_chat_id", String(chatId));
  //     setMessages([
  //       {
  //         type: "ai",
  //         content: '欢迎来到锦桦的异世界',
  //       }
  //     ]);
  //     setInputValue(""); // 清空输入框
  //   }
  //     catch(e){
  //       console.error("创建新对话失败",e);
  //     }
     
  //   };




  const handleSend = async () => {
    const msg = inputValue.trim();
    if (!msg) return;

    const timestamp = new Date().toLocaleTimeString();
    setMessages(prev => [...prev, { type: 'user', content: msg, timestamp }]);
    setInputValue("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('question', msg);
      if (chatId) {
        formData.append('chat_id', chatId);
      }

      const res = await fetch('http://10.158.36.225:8080/ai/chat/role/role1', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error(`HTTP错误: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiAnswer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const cleanedChunk = chunk
          .split('\n')
          .map(line => line.replace(/^data:\s*/, ''))
          .join('')
          .replace(/\n/g, '');
        


        // 过滤掉包含chat_id的chunk后，再添加到aiAnswer中
        if (!cleanedChunk.startsWith("__chat_id__:")) {
          aiAnswer += cleanedChunk;
        }

        // aiAnswer += cleanedChunk;
        fullResponse += cleanedChunk;

        setMessages(prev => {
          const lastAiIndex = [...prev].reverse().findIndex(
            m => m.type === 'ai' && m.timestamp === timestamp
          );
          const realIndex = lastAiIndex === -1 ? -1 : prev.length - 1 - lastAiIndex;

          if (realIndex === -1) {
            return [...prev, { type: 'ai', content: aiAnswer.replace(/\n/g, '<br>'), timestamp }];
          } else {
            return prev.map((m, i) => i === realIndex ?
              { ...m, content: aiAnswer.replace(/\n/g, '<br>') } : m);
          }
        });
      }

      // 每次都尝试提取chat_id并保存（只要后端返回了chat_id）
      let newChatId = null;
      // 1. 尝试直接解析JSON
      try {
        const jsonMatch = fullResponse.match(/\{[^}]*"chat_id"[^}]*\}/);
        if (jsonMatch) {
          const obj = JSON.parse(jsonMatch[0]);
          if (obj.chat_id) {
            newChatId = obj.chat_id;
          }
        }
      } catch (e) { /* 忽略JSON解析失败 */ }
      // 2. 如果还没拿到，尝试正则扒字符串
      if (!newChatId && fullResponse.includes('"chat_id":')) {
        const match = fullResponse.match(/"chat_id":\s*"([^\"]+)"/);
        if (match && match[1]) {
          newChatId = match[1];
        }
      }
      if (!chatId && newChatId && newChatId !== chatId) {
        setChatId(String(newChatId));
        localStorage.setItem('current_chat_id', String(newChatId));
        console.log('新chat_id已保存:', newChatId);
        // 新建对话后，优雅地刷新历史列表
        fetchHistoryList();
      }

      await fetchHistoryList(); // 每次发送消息后强制刷新历史记录

    } catch (e) {
      setMessages(prev => [...prev, {
        type: 'ai',
        content: `请求失败: ${e.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setChatId(null);
    localStorage.removeItem('current_chat_id');
    setInputValue("");
  };

  // 只保留 GET /ai/ 的 useEffect。
  useEffect(() => {
    const storedChatId = localStorage.getItem('current_chat_id');
    if (storedChatId) {
      setChatId(storedChatId);
      handleSelectHistory(storedChatId); // 拉取该chatId的历史消息
    } else {
      handleNewChat(); // 自动新建
    }
    fetchHistoryList();
    // eslint-disable-next-line
  }, []);

  // 切换历史会话（POST /ai/history?chat_id=xxx）
  const handleSelectHistory = async (id) => {
    setChatId(String(id));
    localStorage.setItem('current_chat_id', String(id));
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const res = await fetch(`http://10.158.36.225:8080/ai/history?chat_id=${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('获取历史消息失败');
      const historyData = await res.json();
      const formattedMessages = (historyData.history || []).map(msg => ({
        type: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content,
        timestamp: msg.timestamp || new Date().toLocaleTimeString()
      }));
      setMessages(formattedMessages);
    } catch (e) {
      setMessages([]);
    }
  };

 
  // const handleNewChat = async () => {
  //   const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  //   try {
  //     const res = await fetch('http://10.158.36.225:8080/ai/newchat', {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });
  //     const data = await res.json();
  //     if (data && data.chat_id) {
  //       setChatId(String(data.chat_id));
  //       localStorage.setItem('current_chat_id', String(data.chat_id));
  //       setMessages([
  //         {
  //           type: "ai",
  //           content: '欢迎来到锦桦的异世界',
  //         }
  //       ]);
  //       setInputValue(""); 
  //     }
  //   } catch (e) {
      
  //   }
  // };
 
  const handleNewChat = async () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    try {
      const formData = new FormData();
      formData.append('role', 'role1');
      const res = await fetch('http://10.158.36.225:8080/ai/newchat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let responseText = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          responseText += decoder.decode(value);
        }
        const chatId = res.headers.get("X-Chat-Id");
        if (chatId) {
          setChatId(chatId);
          localStorage.setItem("current_chat_id", chatId);
        }
        setMessages([
          {
            type: "ai",
            content: "欢迎来到锦桦的异世界",
          }
        ]);
        await fetchHistoryList(); // 新建对话后强制刷新历史记录
      }
    } catch (e) {
      console.error("对话出错:", e);
    }
  };


  return (
    <>
      {/* 开场黑幕+打字机+继续按钮 */}
      {opening && (
        <div className={`demoone-mask${!showButton ? ' mask-fadeout' : ''}`}>
          <div className="demoone-story-text">
            {openingText.split("").map((char, idx) => (
              <span
                key={idx}
                style={{
                  visibility: idx < visibleCount ? "visible" : "hidden",
                  transition: "visibility 0s"
                }}
              >
                {char}
              </span>
            ))}
          </div>
          {showButton && (
            <button className={`demoone-start-btn${!showButton ? ' btn-fadeout' : ''}`} onClick={handleStart}>
              继续
            </button>
          )}
        </div>
      )}
      {/* 主内容，只有开场动画结束后才显示 */}
      <div className={`demoone-bg${!opening ? ' bg-fadein' : ''}`}>
      <video
          autoPlay
          loop
          muted
          playsInline
          className="bg-video"
          src="/one.mp4" // 这里填写你的视频路径
        />
      </div>
      <div
        className={`demoone-content${!opening ? ' content-fadein' : ''}`}
        style={opening ? { visibility: 'hidden', pointerEvents: 'none' } : {}}
      >
        {/* 原有内容 */}
{/*         
          // <div className="chat-id-info">
          //   对话ID: {String(chatId).substring(0, 8)}...
          //   <button onClick={resetChat} className="reset-chat-btn">
          //     新对话
          //   </button>
          // </div> */}
        

        <div className="demoone-flex-container">
          <div className="demoone-chat-area" style={{position: "relative"}}>
            <div className="demoone-left-float">
              {/* 这里放你想要的内容，比如图片、角色、装饰等 */}
            </div>
            <div className="demoone-chat-box">
              <div className="demoone-chat-messages">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`demoone-chat-row demoone-chat-row-${msg.type}`}>
                    {msg.type === 'ai' && (
                      <div className="demoone-avatar demoone-avatar-ai">
                        <img src="../../../../public/one.png" alt="AI头像" />
                        <div className="demoone-name">锦桦</div>
                      </div>
                    )}
                    <div
                      className={`demoone-bubble demoone-bubble-${msg.type}`}
                      dangerouslySetInnerHTML={{ __html: msg.content }}
                    />
                    {msg.type === 'user' && (
                      <div className="demoone-avatar demoone-avatar-user">
                        <img src="../../../../public/my.jpg" alt="用户头像" />
                        <div className="demoone-name">您</div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef}></div>
              </div>
              <div className="demoone-chat-input-area">
                <input
                  ref={inputRef}
                  className="demoone-chat-input"
                  type="text"
                  placeholder="请输入..."
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button className="demoone-chat-send" onClick={handleSend} disabled={isLoading}>
                  发送
                </button>
              </div>
              <div className="demoone-bottom-btns">
                <button className="demoone-btn-main" onClick={console.log(chatId)}>继 续</button>
                <button className="demoone-btn-skip">跳过</button>
              </div>
            </div>
          </div>
          <div className="demoone-history-area">
            <button className="history-item new-chat-btn" onClick={handleNewChat} style={{marginBottom: '10px', fontWeight: 'bold'}}>
              + 新建对话
            </button>
            <div className="history-header">历史对话</div>
            <div className="history-list">
              {historyList.length === 0 && <div className="history-empty">暂无历史</div>}
              {historyList.map(item => (
                <button
                  key={item.chat_id}
                  className={`history-item${item.chat_id === chatId ? ' active' : ''}`}
                  onClick={() => handleSelectHistory(item.chat_id)}
                >
                  {item.chat_name || `对话${item.chat_id.slice(0, 6)}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DemoOne;






