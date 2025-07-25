import React, { useState } from 'react';
import './itoAddEdit.css'; // 正确！
import { Navigate, useNavigate} from 'react-router-dom';

const RegisterPage = () => {
  const navigate = useNavigate(); // 获取导航函数
  const [mode, setMode] = useState('normal'); // 'normal' or 'email'

  // 普通注册表单状态
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  // 错误提示状态
  const [errors, setErrors] = useState({});
  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  // 注册成功状态
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // 邮箱注册表单状态
  const [emailForm, setEmailForm] = useState({
    email: '',
    code: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [emailErrors, setEmailErrors] = useState({});
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailRegisterSuccess, setEmailRegisterSuccess] = useState(false);
  const [codeSending, setCodeSending] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);

  // 普通注册表单处理
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 实时清除对应字段的错误提示
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 表单验证
  const validateForm = () => {
    const newErrors = {};
    const usernameRegex = /^[a-zA-Z0-9_]{4,16}$/; // 4-16位字母数字下划线
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,20}$/; // 8-20位包含大小写字母和数字

    if (!formData.username) {
      newErrors.username = '用户名不能为空';
    } else if (!usernameRegex.test(formData.username)) {
      newErrors.username = '用户名需为4-16位字母、数字或下划线';
    }

    if (!formData.password) {
      newErrors.password = '密码不能为空';
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = '密码需8-20位，包含大小写字母和数字';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 模拟后端注册请求（此处为预留接口）
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // 表单验证
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // 后端接口地址（用户后续需替换为实际地址）
      const backendUrl = 'http://localhost:8080/sign_up/'; // 后端注册接口占位符
      
      // 发送注册请求
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '注册失败，请稍后再试');
      }

      // 注册成功处理
      setRegisterSuccess(true);
      // 清空表单
      setFormData({ username: '', password: '', confirmPassword: '' });
      
      // 可根据需要添加成功后的跳转逻辑
      // setTimeout(() => {
      //   window.location.href = '/login';
      // }, 2000);

    } catch (error) {
      setErrors({ server: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  // 邮箱注册表单处理
  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailForm(prev => ({ ...prev, [name]: value }));
    if (emailErrors[name]) {
      setEmailErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  const validateEmailForm = () => {
    const newErrors = {};
    const emailRegex = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
    const usernameRegex = /^[a-zA-Z0-9_]{4,16}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,20}$/;
    if (!emailForm.email) {
      newErrors.email = '邮箱不能为空';
    } else if (!emailRegex.test(emailForm.email)) {
      newErrors.email = '邮箱格式不正确';
    }
    if (!emailForm.code) {
      newErrors.code = '验证码不能为空';
    }
    if (!emailForm.username) {
      newErrors.username = '用户名不能为空';
    } else if (!usernameRegex.test(emailForm.username)) {
      newErrors.username = '用户名需为4-16位字母、数字或下划线';
    }
    if (!emailForm.password) {
      newErrors.password = '密码不能为空';
    } else if (!passwordRegex.test(emailForm.password)) {
      newErrors.password = '密码需8-20位，包含大小写字母和数字';
    }
    if (!emailForm.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (emailForm.password !== emailForm.confirmPassword) {
      newErrors.confirmPassword = '两次密码不一致';
    }
    setEmailErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleEmailRegister = async (e) => {
    e.preventDefault();
    if (!validateEmailForm()) return;
    setEmailLoading(true);
    try {
      const response = await fetch('http://localhost:8080/by_code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailForm.email,
          code: emailForm.code,
          username: emailForm.username,
          password: emailForm.password
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || '注册失败，请稍后再试');
      setEmailRegisterSuccess(true);
      setEmailForm({ email: '', code: '', username: '', password: '', confirmPassword: '' });
    } catch (error) {
      setEmailErrors({ server: error.message });
    } finally {
      setEmailLoading(false);
    }
  };
  // 发送验证码
  const handleSendCode = async () => {
    if (!emailForm.email) {
      setEmailErrors(prev => ({ ...prev, email: '请先输入邮箱' }));
      return;
    }
    setCodeSending(true);
    setEmailErrors(prev => ({ ...prev, code: '' }));
    try {
      const response = await fetch('http://localhost:8080/send_verification_code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailForm.email })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || '验证码发送失败');
      setCodeCountdown(60);
      // 倒计时
      const timer = setInterval(() => {
        setCodeCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCodeSending(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setEmailErrors(prev => ({ ...prev, code: error.message }));
      setCodeSending(false);
    }
  };

  const goToEnvironment = () => {
    navigate('/'); // 导航到目标路径
  };

  return (
    <div className="register-container">
      {/* 背景装饰元素 */}
      <div className="bg-decoration"></div>
      
      {/* 注册卡片 */}
      <div className="register-card">
        <div className="register-header">
          <h1>创建账号</h1>
          <p>开启您的全新体验</p>
        </div>

        {mode === 'normal' ? (
          registerSuccess ? (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h2>注册成功！</h2>
              <p>您的账号已创建完成</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="register-form">
              {/* 用户名输入 */}
              <div className="form-group">
                <label htmlFor="username">用户名</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="请输入用户名"
                    className={errors.username ? 'invalid' : ''}
                    disabled={isLoading}
                  />
                  {errors.username && <span className="error-icon">!</span>}
                </div>
                {errors.username && <span className="error-message">{errors.username}</span>}
              </div>

              {/* 密码输入 */}
              <div className="form-group">
                <label htmlFor="password">密码</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="请输入密码"
                    className={errors.password ? 'invalid' : ''}
                    disabled={isLoading}
                  />
                  {errors.password && <span className="error-icon">!</span>}
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
                <span className="password-hint">密码需包含大小写字母和数字，长度8-20位</span>
              </div>

              {/* 确认密码输入 */}
              <div className="form-group">
                <label htmlFor="confirmPassword">确认密码</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="请再次输入密码"
                    className={errors.confirmPassword ? 'invalid' : ''}
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && <span className="error-icon">!</span>}
                </div>
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>

              {/* 服务器错误提示 */}
              {errors.server && <div className="server-error">{errors.server}</div>}

              {/* 注册按钮 */}
              <button 
                type="submit" 
                className="register-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="loader"></div>
                ) : (
                  '注册'
                )}
              </button>
              
              {/* 已有账号链接 */}
              <div className="login-link">
                已有账号？<button onClick={goToEnvironment} className="link-button">立即登录</button>
              </div>
              <div className="other-link" style={{ marginTop: 8 }}>
                <button type="button" className="link-button" onClick={() => setMode('email')}>邮箱注册</button>
              </div>
            </form>
          )
        ) : (
          emailRegisterSuccess ? (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h2>注册成功！</h2>
              <p>您的账号已创建完成</p>
            </div>
          ) : (
            <form onSubmit={handleEmailRegister} className="register-form">
              <div className="form-group">
                <label htmlFor="email">邮箱</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={emailForm.email}
                    onChange={handleEmailChange}
                    placeholder="请输入邮箱"
                    className={emailErrors.email ? 'invalid' : ''}
                    disabled={emailLoading}
                  />
                  {emailErrors.email && <span className="error-icon">!</span>}
                </div>
                {emailErrors.email && <span className="error-message">{emailErrors.email}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="code">验证码</label>
                <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={emailForm.code}
                    onChange={handleEmailChange}
                    placeholder="请输入验证码"
                    className={emailErrors.code ? 'invalid' : ''}
                    disabled={emailLoading}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="get-code-btn"
                    onClick={handleSendCode}
                    disabled={codeSending || codeCountdown > 0 || emailLoading}
                    style={{ marginLeft: 8, minWidth: 90 }}
                  >
                    {codeCountdown > 0 ? `${codeCountdown}s后重试` : '获取验证码'}
                  </button>
                  {emailErrors.code && <span className="error-icon">!</span>}
                </div>
                {emailErrors.code && <span className="error-message">{emailErrors.code}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="username">用户名</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="email-username"
                    name="username"
                    value={emailForm.username}
                    onChange={handleEmailChange}
                    placeholder="请输入用户名"
                    className={emailErrors.username ? 'invalid' : ''}
                    disabled={emailLoading}
                  />
                  {emailErrors.username && <span className="error-icon">!</span>}
                </div>
                {emailErrors.username && <span className="error-message">{emailErrors.username}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="password">密码</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    id="email-password"
                    name="password"
                    value={emailForm.password}
                    onChange={handleEmailChange}
                    placeholder="请输入密码"
                    className={emailErrors.password ? 'invalid' : ''}
                    disabled={emailLoading}
                  />
                  {emailErrors.password && <span className="error-icon">!</span>}
                </div>
                {emailErrors.password && <span className="error-message">{emailErrors.password}</span>}
                <span className="password-hint">密码需包含大小写字母和数字，长度8-20位</span>
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">确认密码</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    id="email-confirmPassword"
                    name="confirmPassword"
                    value={emailForm.confirmPassword}
                    onChange={handleEmailChange}
                    placeholder="请再次输入密码"
                    className={emailErrors.confirmPassword ? 'invalid' : ''}
                    disabled={emailLoading}
                  />
                  {emailErrors.confirmPassword && <span className="error-icon">!</span>}
                </div>
                {emailErrors.confirmPassword && <span className="error-message">{emailErrors.confirmPassword}</span>}
              </div>
              {emailErrors.server && <div className="server-error">{emailErrors.server}</div>}
              <button type="submit" className="register-btn" disabled={emailLoading}>
                {emailLoading ? (<div className="loader"></div>) : ('注册')}
              </button>
              <div className="login-link">
                已有账号？<button onClick={goToEnvironment} className="link-button">立即登录</button>
              </div>
              <div className="other-link" style={{ marginTop: 8,
              marginLeft:0,
               }}>
                <button type="button" className="link-button" onClick={() => setMode('normal')}>返回普通注册</button>
              </div>
            </form>
          )
        )}
      </div>
    </div>
  );
};

export default RegisterPage;