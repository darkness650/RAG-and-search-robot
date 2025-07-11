//这是主页面


import { useState  ,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import './Login.css'; // 如果需要单独提取样式可以用这个（这里直接内嵌了）

const Login = () => {
  // 状态管理（替代原来的DOM操作）
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [passwordType, setPasswordType] = useState('password'); // 控制密码显示类型
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // 模态框状态
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('用户名或密码错误，请重试');


  const navigate = useNavigate();




 


  

// 在组件内部添加这个副作用
useEffect(() => {
  // 动态加载 Font Awesome 图标
  const faLink = document.createElement('link');
  faLink.rel = 'stylesheet';
  faLink.href = 'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css';
  document.head.appendChild(faLink);

  // 动态加载 Tailwind CSS
  const twScript = document.createElement('script');
  twScript.src = 'https://cdn.tailwindcss.com';
  twScript.onload = () => {
    // 配置 Tailwind 主题
    window.tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '#165DFF',
            secondary: '#4080FF',
            neutral: {
              100: '#F2F3F5',
              200: '#E5E6EB',
              300: '#C9CDD4',
              400: '#86909C',
              500: '#4E5969',
              600: '#272E3B',
              700: '#1D2129',
            },
          },
          boxShadow: {
            'card': '0 10px 30px -5px rgba(0, 0, 0, 0.1)',
            'button': '0 4px 14px 0 rgba(22, 93, 255, 0.4)',
          }
        },
      }
    };

    // 添加自定义工具类
    const style = document.createElement('style');
    style.type = 'text/tailwindcss';
    style.textContent = `
      @layer utilities {
        .form-input-focus {
          @apply border-primary ring-2 ring-primary/20;
        }
        .btn-hover {
          @apply transform -translate-y-0.5 shadow-button transition-all duration-300;
        }
        .card-animation {
          @apply transition-all duration-500 ease-in-out transform hover:scale-[1.01] hover:shadow-lg;
        }
      }
    `;
    document.head.appendChild(style);
  };
  document.head.appendChild(twScript);

  // 清理函数
  return () => {
    document.head.removeChild(faLink);
    document.head.removeChild(twScript);
  };
}, []);


  // 切换密码可见性
  const togglePassword = () => {
    setPasswordType(prev => prev === 'password' ? 'text' : 'password');
  };

  // 登录API调用（保持逻辑不变，适配React语法）
 // 修改 loginAPI 函数
const loginAPI = async (email, password) => {
  try {
    // 创建 form-data
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await fetch('http://10.158.36.225:8080/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded' // 重要：使用 form-urlencoded
      },
      body: formData.toString() // 转换为字符串
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '登录失败，请重试');
    }

    return await response.json();
  } catch (error) {
    console.error('登录错误:', error);
    throw error;
  }
};

  // 表单提交处理（核心逻辑）
  const handleSubmit = async (event) => {
    event.preventDefault();
    let isValid = true;

    // 重置错误提示
    setEmailError('');
    setPasswordError('');

    // 前端验证
    if (!email.trim()) {
      setEmailError('请输入邮箱或用户名');
      isValid = false;
    }
    if (!password.trim()) {
      setPasswordError('请输入密码');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('密码长度至少为6个字符');
      isValid = false;
    }

    if (!isValid) return;

    // 显示加载状态
    setIsLoading(true);

    try {
      // 调用登录API
      const data = await loginAPI(email, password);
     
      // 登录成功：根据后端返回结构调整（后端返回的是 access_token 字段）
      if (data.access_token) { // 👈 修改这里，匹配后端返回的字段名
        // 保存token到本地存储
        
        remember 
          ? localStorage.setItem('auth_token', data.access_token) 
          : sessionStorage.setItem('auth_token', data.access_token);
        
        // 立即跳转（无需等待3秒）
        navigate('/environmentManage'); // 核心：跳转到目标路径); // 👈 使用 useNavigate 进行跳转
      }
    } catch (error) {
      // 显示错误信息
      setErrorMessage(error.message || '登录失败，请重试');
      setIsError(true);
    } finally {
      // 隐藏加载状态
      setIsLoading(false);
    }
  };


  // 关闭模态框
  const closeModal = (modalType) => {
    if (modalType === 'success') setIsSuccess(false);
    if (modalType === 'error') setIsError(false);
  };

  return (
    <div className="font-inter bg-[linear-gradient(135deg,#f5f7fa_0%,#c3cfe2_100%)] min-h-screen flex items-center justify-center p-4">
      {/* 登录卡片 */}
      <div className="w-full max-w-md bg-white/30 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden card-animation">
        {/* 卡片头部 */}
        <div className="p-6 md:p-8 border-b border-neutral-200">
          <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-bold text-neutral-700">欢迎回来</h1>
          <p className="text-neutral-500 mt-2">请登录您的账户继续使用</p>
        </div>
        
        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {/* 用户名/邮箱 */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
              邮箱或用户名
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <i className="fa fa-user-o"></i>
              </span>
              <input 
                type="text" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:form-input-focus transition-all duration-300"
                placeholder="请输入邮箱或用户名"
                required
              />
            </div>
            {emailError && (
              <p className="text-sm text-red-500">{emailError}</p>
            )}
          </div>
          
          {/* 密码 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                密码
              </label>
              <a href="#" className="text-sm text-primary hover:text-secondary transition-colors duration-300">
                忘记密码?
              </a>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <i className="fa fa-lock"></i>
              </span>
              <input 
                type={passwordType} // 动态控制密码显示类型
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:form-input-focus transition-all duration-300"
                placeholder="请输入密码"
                required
              />
              <button 
                type="button" 
                onClick={togglePassword}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-600 transition-colors duration-300"
              >
                <i className={passwordType === 'password' ? 'fa fa-eye-slash' : 'fa fa-eye'}></i>
              </button>
            </div>
            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}
          </div>
          
          {/* 记住我 */}
          <div className="flex items-center">
            <input 
              id="remember" 
              type="checkbox" 
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary/30 transition-colors duration-300"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-neutral-600">
              记住我的登录状态
            </label>
          </div>
          
          {/* 登录按钮 */}
          <button 
            type="submit" 
            className="w-full bg-primary hover:bg-secondary text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 hover:btn-hover flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fa fa-spinner fa-spin mr-2"></i>
                <span>登录中...</span>
              </>
            ) : (
              <>
                <span>登录</span>
                <i className="fa fa-arrow-right ml-2"></i>
              </>
            )}
          </button>
          
          {/* 分隔线 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-neutral-400">或使用以下方式登录</span>
            </div>
          </div>
          
          {/* 社交登录 */}
          <div className="grid grid-cols-3 gap-3">
            <button type="button" className="flex items-center justify-center py-2 px-4 border border-neutral-300 rounded-lg text-neutral-600 hover:bg-neutral-50 transition-colors duration-300">
              <i className="fa fa-weixin text-xl"></i>
            </button>
            <button type="button" className="flex items-center justify-center py-2 px-4 border border-neutral-300 rounded-lg text-neutral-600 hover:bg-neutral-50 transition-colors duration-300">
              <i className="fa fa-qq text-xl"></i>
            </button>
            <button type="button" className="flex items-center justify-center py-2 px-4 border border-neutral-300 rounded-lg text-neutral-600 hover:bg-neutral-50 transition-colors duration-300">
              <i className="fa fa-github text-xl"></i>
            </button>
          </div>
          
          {/* 注册链接 */}
          <p className="text-center text-neutral-600 text-sm">
            还没有账户? 
            <a href="/IOT/IOTAddEdit/add" className="text-primary hover:text-secondary font-medium transition-colors duration-300">
              立即注册
            </a>
          </p>
        </form>
      </div>
      
      {/* 加载中模态框 */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl transform transition-all duration-300 scale-100">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <h3 className="text-lg font-medium text-neutral-700 mb-2">正在登录...</h3>
              <p className="text-neutral-500 text-center">请稍候，我们正在验证您的信息</p>
            </div>
          </div>
        </div>
      )}
      
      {/* 成功提示模态框 */}
      {isSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl transform transition-all duration-300 scale-100">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500 mb-4">
                <i className="fa fa-check text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-neutral-700 mb-2">登录成功</h3>
              <p className="text-neutral-500 mb-6">您已成功登录，正在跳转至首页...</p>
              <button 
                onClick={() => closeModal('success')}
                className="bg-primary hover:bg-secondary text-white font-medium py-2 px-6 rounded-lg transition-all duration-300 hover:btn-hover"
              >
                立即跳转
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 错误提示模态框 */}
      {isError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl transform transition-all duration-300 scale-100">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                <i className="fa fa-times text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-neutral-700 mb-2">登录失败</h3>
              <p className="text-neutral-500 mb-6">{errorMessage}</p>
              <button 
                onClick={() => closeModal('error')}
                className="bg-primary hover:bg-secondary text-white font-medium py-2 px-6 rounded-lg transition-all duration-300 hover:btn-hover"
              >
                重新登录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;