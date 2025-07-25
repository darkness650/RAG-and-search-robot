import React, { useRef, useState } from 'react';
import './documentlearn.css';

const DocumentLearn = () => {
  const [messages, setMessages] = useState([]); // AI对话区
  const [inputValue, setInputValue] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef();

  // 处理文件选择
  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  // 处理输入变化
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // 处理提交
  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!inputValue.trim() && !file) return;
  const userMsg = inputValue.trim();
  setMessages(prev => [...prev, { type: 'user', content: userMsg, timestamp: new Date().toLocaleTimeString() }]);
  setIsLoading(true);
  try {
    const formData = new FormData();
    formData.append('question', userMsg);
    if (file) formData.append('files', file);
    formData.append('web_search', false);
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const res = await fetch('http://localhost:8080/ai/chat/qwen-max', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!res.ok) throw new Error(`HTTP错误: ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let aiAnswer = '';
    let timestamp = new Date().toLocaleTimeString();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      
      // 处理每个数据块，重点是移除__chat_id__:数字格式的内容
      const processedChunk = chunk
        .split('\n')
        .map(line => {
          // 先移除data:前缀
          let cleaned = line.replace(/^data:\s*/, '');
          // 移除__chat_id__:数字这种格式的字符串
          cleaned = cleaned.replace(/__chat_id__:\d+/g, '');
          // 移除可能的空字符
          return cleaned.trim();
        })
        .filter(line => line !== '') // 过滤空行
        .join('');
      
      aiAnswer += processedChunk;
      
      // 更新消息显示
      setMessages(prev => {
        const lastAiIndex = [...prev].reverse().findIndex(m => m.type === 'ai' && m.timestamp === timestamp);
        const realIndex = lastAiIndex === -1 ? -1 : prev.length - 1 - lastAiIndex;
        if (realIndex === -1) {
          return [...prev, { type: 'ai', content: aiAnswer.replace(/\n/g, '<br>'), timestamp }];
        } else {
          return prev.map((m, i) => i === realIndex ? { ...m, content: aiAnswer.replace(/\n/g, '<br>') } : m);
        }
      });
    }
  } catch (e) {
    setMessages(prev => [...prev, { type: 'ai', content: `请求失败: ${e.message}`, timestamp: new Date().toLocaleTimeString() }]);
  } finally {
    setIsLoading(false);
    setInputValue('');
    // 重置文件，避免重复上传
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
};

  const hasMsg = messages.length > 0;

  return (
    <div className={`doclearn-fullscreen${hasMsg ? ' has-msg' : ''}`}>
      {/* 顶部AI对话区 */}
      <div className={`doclearn-chat-area${hasMsg ? ' doclearn-chat-area-large' : ''}`}>
        {messages.length === 0 ? (
          <div className="doclearn-chat-empty">你可以上传文档并输入你的需求，AI会为你分析！</div>
        ) : (
          <div className="doclearn-chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`doclearn-chat-row doclearn-chat-row-${msg.type}`}>
                <div className={`doclearn-bubble doclearn-bubble-${msg.type}`} dangerouslySetInnerHTML={{ __html: msg.content }} />
                <div className="doclearn-timestamp">{msg.timestamp}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* 下方上传区+输入区，吸底 */}
      <form className={`doclearn-bottom-bar${hasMsg ? ' doclearn-bottom-bar-fixed' : ''}`} onSubmit={handleSubmit}>
        <label className="doclearn-upload-btn">
          上传文档
          <input
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            ref={fileInputRef}
          />
        </label>
        {file && <span className="doclearn-file-name">{file.name}</span>}
        <input
          className="doclearn-input"
          placeholder="请输入对文档的具体要求..."
          value={inputValue}
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <button className="doclearn-submit-btn" type="submit" disabled={isLoading}>
          {isLoading ? '提交中...' : '提交'}
        </button>
      </form>
    </div>
  );
};

export default DocumentLearn;





// import './videosummary.css';

// const VideoSummary = () => {
//   return (
//     <div className="videosum-root">
//       <h1 className="videosum-title">AI 搜索</h1>
//       <p className="videosum-desc">实时资讯，丰富信源，整合搜索</p>
//       <div className="videosum-input-area">
//         <input className="videosum-input" placeholder="搜索、提问或发消息" />
//         <button className="videosum-search-btn">全网搜索</button>
//       </div>
//       <div className="videosum-section">
//         <h2>定制属于你的新闻</h2>
//         <div className="videosum-tags">
//           <span>AI</span><span>科技</span><span>财经</span><span>科学</span><span>时事</span><span>汽车</span><span>体育</span><span>娱乐</span>
//         </div>
//       </div>
//       <div className="videosum-section">
//         <h2>热点新闻</h2>
//         <div className="videosum-news-list">
//           <div className="videosum-news-item">新闻1</div>
//           <div className="videosum-news-item">新闻2</div>
//           <div className="videosum-news-item">新闻3</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VideoSummary;