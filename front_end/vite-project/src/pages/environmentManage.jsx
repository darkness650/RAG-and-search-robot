import React, { useState, useEffect } from 'react';
import "./IOT/environmentManage.css";
// 导入Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCloudUpload, 
  faCheck, 
  faTimes, 
  faFileImage, 
  faFileVideo, 
  faFileAudio, 
  faFilePdf, 
  faFileWord, 
  faFileExcel, 
  faFilePowerpoint, 
  faFile 
} from '@fortawesome/free-solid-svg-icons';

library.add(
  faCloudUpload, 
  faCheck, 
  faTimes, 
  faFileImage, 
  faFileVideo, 
  faFileAudio, 
  faFilePdf, 
  faFileWord, 
  faFileExcel, 
  faFilePowerpoint, 
  faFile
);

const ChatWidget = () => {
  // 管理聊天消息的状态
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fileList, setFileList] = useState([]); // 存储选中的文件列表
  const [dragActive, setDragActive] = useState(false); // 拖放状态
  const [uploadSuccess, setUploadSuccess] = useState(false); // 上传成功状态
  // 新增：联网搜索状态
  const [webSearch, setWebSearch] = useState(false);
// 新增：标记上传成功动画是否结束
const [uploadSuccessFinished, setUploadSuccessFinished] = useState(false);
  // 处理文件选择和拖放
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  // 处理拖放事件
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      document.getElementById('file-upload').value = '';
    }
  };

  // 处理文件列表
  const handleFiles = (files) => {
    const newFiles = Array.from(files).filter(file => 
      !fileList.some(existing => existing.name === file.name && existing.size === file.size)
    );
    
    const filesWithInfo = newFiles.map(file => ({
      file,
      name: file.name,
      size: formatFileSize(file.size),
      type: getFileType(file),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    
    setFileList(prev => [...prev, ...filesWithInfo]);
    
    setUploadSuccess(true);
    setUploadSuccessFinished(false); // 重置状态
    setTimeout(() => {
      setUploadSuccess(false);
      setUploadSuccessFinished(true); // 动画结束，标记为已完成
    }, 1500); // 1.5秒后隐藏动画并触发颜色变化
  };

  // 移除单个文件（删除按钮核心逻辑）
  const removeFile = (index) => {
    const newFileList = [...fileList];
    newFileList.splice(index, 1);
    setFileList(newFileList);
  };

  // 获取文件类型图标（对应Font Awesome的图标组件）
  const getFileIcon = (type) => {
    switch(type) {
      case 'image': return <FontAwesomeIcon icon="file-image" />;
      case 'video': return <FontAwesomeIcon icon="file-video" />;
      case 'audio': return <FontAwesomeIcon icon="file-audio" />;
      case 'pdf': return <FontAwesomeIcon icon="file-pdf" />;
      case 'word': return <FontAwesomeIcon icon="file-word" />;
      case 'excel': return <FontAwesomeIcon icon="file-excel" />;
      case 'ppt': return <FontAwesomeIcon icon="file-powerpoint" />;
      default: return <FontAwesomeIcon icon="file" />;
    }
  };

  // 获取文件类型
  const getFileType = (file) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['xls', 'xlsx'].includes(ext)) return 'excel';
    if (['ppt', 'pptx'].includes(ext)) return 'ppt';
    return 'file';
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 新增：切换联网搜索状态
  const handleToggleWebSearch = () => {
    setWebSearch(prev => !prev);
  };

  // 发送消息的函数
  const handleSendMessage = async () => {
    const message = inputValue.trim();
    if (!message && fileList.length === 0) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString();
    
    // 生成带文件信息的消息内容
    let content = message;
    if (fileList.length > 0) {
      const fileNames = fileList.map(item => item.name).join('、');
      const fileInfo = `[附带 ${fileList.length} 个文件: ${fileNames}]`;
      content = content ? `${content} ${fileInfo}` : fileInfo;
    }

    // 添加用户消息到聊天记录
    setMessages(prev => [...prev, {
      type: 'user',
      content,
      timestamp
    }]);

    // 清空输入和文件列表
    setInputValue('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('question', message);
      fileList.forEach(({ file }) => {
        formData.append('files', file);
      });
      
      // 使用切换的webSearch状态
      formData.append('web_search', webSearch);

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const res = await fetch('http://10.158.36.225:8080/ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error(`HTTP错误，状态码: ${res.status}`);
      const data = await res.json();
      
      const formattedAnswer = data.result
        .replace(/\n/g, '<br>')
        .replace(/\\n/g, '<br>');

      setMessages(prev => [...prev, {
        type: 'ai',
        content: formattedAnswer,
        timestamp
      }]);

    } catch (e) {
      console.error('请求失败:', e);
      setMessages(prev => [...prev, {
        type: 'error',
        content: `请求失败: ${e.message}`,
        timestamp
      }]);
    } finally {
      setFileList([]);
      setIsLoading(false);
      document.getElementById('file-upload').value = '';
    }
  };

  // 处理回车键发送消息
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  // 自动滚动到最新消息
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  }, [messages]);

  // 清理预览URL
  useEffect(() => {
    return () => {
      fileList.forEach(item => {
        if (item.preview) URL.revokeObjectURL(item.preview);
      });
    };
  }, [fileList]);

  const handleResultClick = () => {
    window.location.href = 'https://www.bilibili.com/video/av362497019/?vd_source=882dfb6e4d0ed7bb6e995d8ce8be71d4';
  };

  return (
    <div className="chat-widget">
      <div className="topbar">这是个神秘对话框</div>
      <div className="left">这边建议您不要随便点击哦</div>
      
      {/* 聊天结果区域，保留原有className和配色，只加外层flex布局 */}
      <div id="chat-container" className="result">
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 16
            }}
          >
            <div
              className={msg.type === 'user' ? 'user-question' : msg.type === 'error' ? 'ai-answer error' : 'ai-answer'}
            >
              <div dangerouslySetInnerHTML={{ __html: msg.content }} />
              <div className="timestamp">{msg.timestamp}</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 输入区域 */}
      <div className="question-container">
        <div className="question">
          {/* 联网搜索按钮 */}
          <button 
            className={`web_search_submit ${webSearch ? 'active' : ''}`}
            onClick={handleToggleWebSearch}
          >
            联网搜索
          </button>
          
          <input
            className="sun"
            placeholder="汪汪队需要我们"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          
          {/* 自定义文件上传组件（完整保留您原来的内容） */}
          <div className="file-upload-container">
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              multiple 
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload"
              className={`upload-label 
    ${dragActive ? 'drag-active' : ''} 
    ${uploadSuccessFinished ? 'upload-success-finished' : ''}`} // 新增这行
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {uploadSuccess ? (
                <FontAwesomeIcon icon="check" className="upload-success" />
              ) : (
                <>
                  <FontAwesomeIcon icon="cloud-upload" />
                  <span>{fileList.length > 0 ? `已选 ${fileList.length} 个` : '上传文件'}</span>
                </>
              )}
            </label>
            
            {/* 已选文件列表 */}
            {fileList.length > 0 && (
              <div className="file-list">
                {fileList.map((item, index) => (
                  <div key={index} className="file-item">
                    <div className="file-icon">
                      {item.type === 'image' ? (
                        <img src={item.preview} alt={item.name} className="preview-img" />
                      ) : (
                        getFileIcon(item.type)
                      )}
                    </div>
                    <div className="file-info">
                      <div className="file-name">{item.name}</div>
                      <div className="file-size">{item.size}</div>
                    </div>
                    {/* 删除按钮 */}
                    <button 
                      className="remove-file" 
                      onClick={() => removeFile(index)}
                      title="删除该文件"
                    >
                      <FontAwesomeIcon icon="times" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button 
            className="submit"
            disabled={isLoading}
            onClick={handleSendMessage}
          >
            {isLoading ? '思考中...' : '汪汪队'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;