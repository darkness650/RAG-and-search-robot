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
      const res = await fetch('http://10.158.36.225:8080/ai/chat/generate', {
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
        const cleanedChunk = chunk
          .split('\n')
          .map(line => line.replace(/^data:\s*/, ''))
          .join('')
          .replace(/\n/g, '');
        aiAnswer += cleanedChunk;
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
// import './picturemaking.css';

// const PictureMaking = () => {
//   return (
//     <div className="picgen-root">
//       <h1 className="picgen-title">图像生成</h1>
//       <p className="picgen-desc">创意高效迭代，让灵感自然生长</p>
//       <div className="picgen-input-area">
//         <input className="picgen-input" placeholder="说说你的灵感..." />
//         <div className="picgen-btn-group">
//           <button>参考图</button>
//           <button>比例</button>
//           <button>风格</button>
//         </div>
//       </div>
//       <div className="picgen-section">
//         <h2>精选</h2>
//         <div className="picgen-gallery">
//           <div className="picgen-img-item">图片1</div>
//           <div className="picgen-img-item">图片2</div>
//           <div className="picgen-img-item">图片3</div>
//           <div className="picgen-img-item">图片4</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PictureMaking;