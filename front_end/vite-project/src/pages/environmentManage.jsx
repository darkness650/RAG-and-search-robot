import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  faFile ,
  faHistory,
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
  faFile,
  faHistory,
);

const ChatInitialTip = () => {
  const [tipText, setTipText] = useState('');

  useEffect(() => {
    // 生成1-5的随机数
    const randomNum = Math.floor(Math.random() * 11) + 1;
    
    // 根据随机数设置提示文案
    let text = '';
    if (randomNum === 1) {
      text = "你正在做什麼？";
    } else if (randomNum === 2) {
      text = "隨時準備好就可以開始了。";
    } else if (randomNum === 3) {
      text = "今天的議程是什麼？";
    } else if (randomNum === 4) {
      text = "你今天在想什麼？";
    } else if (randomNum === 5) {
      text = "我們該從哪裡開始？";
    }else if (randomNum === 6) {
      text = "你的代码又报错了吗？";
    } else if (randomNum === 7) {
      text = "这代码之内，多看一眼都是错。";
    } else if (randomNum === 8) {
      text = "入夜后别乱走，偏殿的灯笼是给bug留的。";
    } else if (randomNum === 9) {
      text = "如山的代码里，藏着多少运行不了的程序。";
    }else if (randomNum === 10) {
      text = "代码里的逻辑，比人心清楚多了。";
    } else if (randomNum === 11) {
      text = "我可以為你做什麼？";
    } 
    setTipText(text);
  }, []);

  return (
    <div className="chat-initial-tip">{tipText}</div>
  );
};








const ChatWidget = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
  // 新增：保存当前会话的chat_id
  const [chatId, setChatId] = useState(location.state?.chatId || null);
  
  // // 处理文件选择和拖放

  const [isModelOpen, setIsModelOpen] = useState(false); // 模型选择菜单是否展开
  const [selectedModel, setSelectedModel] = useState('GPT-4'); // 当前选中的模型
  const [modelUrlSuffix, setModelUrlSuffix] = useState('qwen-max'); // 当前模型对应的URL后缀
  const modelRef = useRef(null); // 用于点击外部关闭菜单
  

  
  // 模型与URL后缀的映射关系 - 核心修改
  const modelMappings = [
    { name: 'GPT-4', suffix: 'qwen-max' },
    { name: 'Claude', suffix: 'deepseek-r1' },
    { name: '文心一言', suffix: 'abab6.5t-chat' }
  ];



     // 点击外部关闭模型选择菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelRef.current && !modelRef.current.contains(event.target)) {
        setIsModelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


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
  

  // 处理模型选择 - 同步更新URL后缀
  const handleModelSelect = (modelName) => {
    // 根据选择的模型名称找到对应的URL后缀
    const selected = modelMappings.find(item => item.name === modelName);
    if (selected) {
      setSelectedModel(modelName);
      setModelUrlSuffix(selected.suffix); // 更新URL后缀
    }
    setIsModelOpen(false);
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
    

     // 添加当前选中的模型信息
     content += ` [使用模型: ${selectedModel}]`;


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
      
      // 传递chat_id，让后端知道这是继续已有对话还是新建对话
      if (chatId) {
        formData.append('chat_id', chatId);
      }

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

       // 动态拼接URL - 核心修改点
       const baseUrl = 'http://10.158.36.225:8080/ai/chat';
      const res = await fetch(`${baseUrl}/${modelUrlSuffix}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error(`HTTP错误，状态码: ${res.status}`);
      // const data = await res.json();
      
      // console.log('发送消息API返回数据:', data);
      
      // // 如果是新建对话，保存返回的chat_id
      // if (!chatId && data.chat_id) {
      //   setChatId(data.chat_id);
       
      // }
      
      // // 从新的API格式中获取AI回复
      // const aiMessage = data.history && data.history.length > 0 ? data.history[0] : null;
      // const formattedAnswer = aiMessage ? aiMessage.content.replace(/\n/g, '<br>').replace(/\\n/g, '<br>') : '抱歉，没有收到回复';

      // setMessages(prev => [...prev, {
      //   type: 'ai',
      //   content: formattedAnswer,
      //   timestamp
      // }]);
    

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aiAnswer = "";  // 当前累积的AI回答内容
      
      // 每次读取后更新显示
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
      
        const chunk = decoder.decode(value, { stream: true });
        // 处理所有 data: 前缀和换行，拼接成一段
        const cleanedChunk = chunk
          .split('\n')
          .map(line => line.replace(/^data:\s*/, ''))
          .join('')
          .replace(/\n/g, '');

        // ✅ 检查是否含有 chat_id
        if (!chatId && cleanedChunk.startsWith("__chat_id__:")) {
          const newChatId = cleanedChunk.replace("__chat_id__:", "").trim();
          setChatId(newChatId);
          continue;
        }
        // 过滤掉包含chat_id的chunk后，再添加到aiAnswer中
        if (!cleanedChunk.startsWith("__chat_id__:")) {
          aiAnswer += cleanedChunk;
        }
      
        setMessages(prev => {
          let newMessages = [...prev];
          // 找到最后一条 AI 消息
          const lastAiIndex = [...prev].reverse().findIndex(msg => msg.type === 'ai' && msg.timestamp === timestamp);
          const realIndex = lastAiIndex === -1 ? -1 : prev.length - 1 - lastAiIndex;
          if (realIndex === -1) {
            newMessages.push({
              type: 'ai',
              content: aiAnswer.replace(/\n/g, '<br>'),
              timestamp
            });
          } else {
            newMessages[realIndex] = {
              ...newMessages[realIndex],
              content: aiAnswer.replace(/\n/g, '<br>')
            };
          }
          return newMessages;
        });
      }


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

  // 处理从侧边栏传递过来的聊天ID
  useEffect(() => {
    if (location.state?.chatId) {
      const chatId = location.state.chatId;
      const chatName = location.state.chatName;
      // 如果是新建对话，保存返回的chat_id
     
      
       setChatId(chatId);
       
      
      // 获取该聊天的历史记录
      const fetchChatHistory = async () => {
        try {
          
          // setChatId(chatId);
          // // 如果是新建对话，保存返回的chat_id
      // if (!chatId && data.chat_id) {
      //   setChatId(data.chat_id);
       
      // }
          
          const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
          console.log('获取聊天历史，chatId:', chatId);
          
          if (!token) {
            console.log('没有token，使用测试数据');
            const testMessages = {
              '1': [
                { type: 'user', content: '你好，我想了解一下这个项目', timestamp: '10:00:00' },
                { type: 'ai', content: '你好！这是一个基于React和Ant Design的前端项目，主要用于IOT设备管理。有什么我可以帮助你的吗？', timestamp: '10:00:30' },
                { type: 'user', content: '能介绍一下主要功能吗？', timestamp: '10:01:00' },
                { type: 'ai', content: '主要功能包括：<br>1. IOT设备发布管理<br>2. 环境配置管理<br>3. 问题汇总和跟踪<br>4. AI智能对话助手<br>5. 文件上传和管理', timestamp: '10:01:30' }
              ],
              '2': [
                { type: 'user', content: '如何添加新的IOT设备？', timestamp: '11:00:00' },
                { type: 'ai', content: '添加IOT设备的步骤：<br>1. 点击"新增"按钮<br>2. 填写设备基本信息<br>3. 上传相关文档<br>4. 提交审核<br>5. 等待审批通过', timestamp: '11:00:45' }
              ],
              '3': [
                { type: 'user', content: '项目开发中遇到了一些技术问题', timestamp: '12:00:00' },
                { type: 'ai', content: '请详细描述一下你遇到的技术问题，我会尽力帮你解决。可以包括：<br>- 错误信息<br>- 复现步骤<br>- 期望结果', timestamp: '12:00:30' },
                { type: 'user', content: 'React组件状态管理的问题', timestamp: '12:01:00' },
                { type: 'ai', content: 'React状态管理建议：<br>1. 使用useState管理简单状态<br>2. 使用useReducer管理复杂状态<br>3. 使用Context API进行跨组件状态共享<br>4. 考虑使用Redux或Zustand等状态管理库', timestamp: '12:01:45' }
              ],
              '4': [
                { type: 'user', content: '如何优化前端性能？', timestamp: '13:00:00' },
                { type: 'ai', content: '前端性能优化建议：<br>1. 代码分割和懒加载<br>2. 图片压缩和CDN加速<br>3. 减少不必要的重渲染<br>4. 使用React.memo和useMemo<br>5. 优化打包配置', timestamp: '13:00:40' }
              ]
            };
            
            const messages = testMessages[chatId] || [
              { type: 'ai', content: `欢迎来到 ${chatName}！这是一个测试对话。`, timestamp: new Date().toLocaleTimeString() }
            ];
            
            setMessages(messages);
            return;
          }
          
          console.log('开始请求API: http://10.158.36.225:8080/ai/history');
          const res = await fetch(`http://10.158.36.225:8080/ai/history?chat_id=${chatId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('API响应状态:', res.status);
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error('API响应错误:', res.status, errorText);
            throw new Error(`获取历史记录失败: ${res.status} - ${errorText}`);
          }
          
          const historyData = await res.json();
          console.log('历史记录数据:', historyData);
          console.log('historyData类型:', typeof historyData);
          console.log('historyData是否为数组:', Array.isArray(historyData));
          
          // 检查数据格式并格式化消息
          let messagesArray = historyData;
          if (!Array.isArray(historyData)) {
            // 如果不是数组，可能数据在某个字段中
            if (historyData.history && Array.isArray(historyData.history)) {
              messagesArray = historyData.history;
            } else if (historyData.messages && Array.isArray(historyData.messages)) {
              messagesArray = historyData.messages;
            } else if (historyData.data && Array.isArray(historyData.data)) {
              messagesArray = historyData.data;
            } else {
              console.error('无法找到消息数组，使用空数组');
              messagesArray = [];
            }
          }
          
          const formattedMessages = messagesArray.map(msg => ({
            type: msg.role === 'user' ? 'user' : 'ai',
            content: msg.content,
            timestamp: msg.timestamp || new Date().toLocaleTimeString()
          }));
          
          console.log('格式化后的消息:', formattedMessages);
          setMessages(formattedMessages);
          
        } catch (e) {
          console.error('加载聊天历史失败:', e);
          // 如果API失败，使用测试数据
          const testMessages = {
            '1': [
              { type: 'user', content: '你好，我想了解一下这个项目', timestamp: '10:00:00' },
              { type: 'ai', content: '你好！这是一个基于React和Ant Design的前端项目，主要用于IOT设备管理。有什么我可以帮助你的吗？', timestamp: '10:00:30' }
            ],
            
          };
          
          const messages = testMessages[chatId] || [
            { type: 'ai', content: `欢迎来到 ${chatName}！API调用失败，显示测试数据。`, timestamp: new Date().toLocaleTimeString() }
          ];
          
          setMessages(messages);
        }
      };
      
      fetchChatHistory();
    }
  }, [location.state]);

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

  return (
    <div className="chat-widget">
      
      
       {/* 模型选择按钮及下拉菜单 */}
       <div className="model-selector" ref={modelRef}>
        <button 
          className='selectbutton'
          onClick={() => setIsModelOpen(!isModelOpen)}
        >
          模型选择
          <FontAwesomeIcon 
            icon="chevron-down" 
            className={`ml-1 transition-transform duration-300 ${isModelOpen ? 'transform rotate-180' : ''}`} 
          />
        </button>
        
        {/* 模型选择下拉菜单 */}
        {isModelOpen && (
          <div className="model-dropdown">
            {modelMappings.map((model, index) => (
              <button 
                key={index}
                className={`model-option ${selectedModel === model.name ? 'active' : ''}`}
                onClick={() => handleModelSelect(model.name)}
              >
                {model.name}
              </button>
            ))}
          </div>
        )}
      </div>

      
{/*       
      <div className="topbar">这是个神秘对话框
       
      </div> */}
      <div className="left">
     
      </div>
      
      {/* 聊天结果区域，保留原有className和配色，只加外层flex布局 */}
      <div
        id="chat-container"
        className={`result${messages.length === 0 ? ' result-initial' : ''}`}
      
        style={messages.length === 0 ? { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 } : {}}
      >
        {messages.length === 0 ? (
          <ChatInitialTip key={chatId || 'no-chat'} />
        ) : (
          messages.map((msg, index) => (
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
          ))
        )}
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