import React, { useRef, useState } from 'react';
import './documentlearn.css';

const DocumentLearn = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(''); // 新增：上传状态反馈
  const fileInputRef = useRef();

  // 处理文件选择
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus(`已选择文件: ${selectedFile.name}`);
    } else {
      setFile(null);
      setUploadStatus('');
    }
  };

  // 处理输入变化
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // 处理提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() && !file) return;

    // 先在聊天记录中显示用户操作（无论上传是否成功）
    let userContent = '';
    if (file) {
      userContent += `<span style="display: flex; align-items: center; gap: 8px;">
        📎 上传文件：${file.name}
      </span>`;
    }
    if (inputValue.trim()) {
      userContent += `${file ? '<br>' : ''}问题：${inputValue.trim()}`;
    }

    setMessages(prev => [...prev, { 
      type: 'user', 
      content: userContent, 
      timestamp: new Date().toLocaleTimeString() 
    }]);

    setIsLoading(true);
    setUploadStatus('正在上传...');

    try {
      const formData = new FormData();
      // 注意：这里的字段名要和后端保持一致，很多时候失败是因为字段名不对
      formData.append('question', inputValue.trim());
      if (file) {
        formData.append('files', file); // 可能需要将files改为file，根据后端接口调整
      }
      formData.append('web_search', false);

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!token) {
        throw new Error('未找到认证信息，请重新登录');
      }

      const res = await fetch('http://localhost:8080/ai/chat/chat', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          // 注意：FormData不需要设置Content-Type，浏览器会自动处理
        },
        body: formData
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`上传失败: ${errorText || res.statusText}`);
      }

      // 处理流式响应
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
          .filter(line => line.trim() !== '')
          .join('')
          .replace(/__chat_id__:\d+/g, '') // 移除chatid
          .replace(/\n/g, '<br>');

        aiAnswer += cleanedChunk;
        
        // 更新AI回复
        setMessages(prev => {
          const lastAiIndex = [...prev].reverse().findIndex(m => m.type === 'ai' && m.timestamp === timestamp);
          const realIndex = lastAiIndex === -1 ? -1 : prev.length - 1 - lastAiIndex;
          
          if (realIndex === -1) {
            return [...prev, { type: 'ai', content: aiAnswer, timestamp }];
          } else {
            return prev.map((m, i) => i === realIndex ? { ...m, content: aiAnswer } : m);
          }
        });
      }

      setUploadStatus('上传成功');

    } catch (e) {
      // 显示错误信息
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: `❌ ${e.message}`, 
        timestamp: new Date().toLocaleTimeString() 
      }]);
      setUploadStatus(`上传失败: ${e.message}`);
    } finally {
      setIsLoading(false);
      setInputValue('');
      // 重置文件选择
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // 3秒后清除上传状态提示
      setTimeout(() => setUploadStatus(''), 3000);
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
                <div 
                  className={`doclearn-bubble doclearn-bubble-${msg.type}`} 
                  dangerouslySetInnerHTML={{ __html: msg.content }} 
                />
                <div className="doclearn-timestamp">{msg.timestamp}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 下方上传区+输入区 */}
      <form className={`doclearn-bottom-bar${hasMsg ? ' doclearn-bottom-bar-fixed' : ''}`} onSubmit={handleSubmit}>
        <label className="doclearn-upload-btn">
          上传文档
          <input
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            ref={fileInputRef}
            accept=".txt,.pdf,.doc,.docx,.xls,.xlsx" // 限制文件类型
          />
        </label>
        
        {/* 显示文件状态或错误信息 */}
        <div className="doclearn-file-status">
          {file && <span className="doclearn-file-name">{file.name}</span>}
          {uploadStatus && <span className="doclearn-upload-status">{uploadStatus}</span>}
        </div>
        
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
