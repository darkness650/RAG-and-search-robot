import React, { useState } from 'react';
import './itoAddEdit.css'; // 正确！
import { Navigate, useNavigate} from 'react-router-dom';
const RegisterPage = () => {
  // 表单状态管理
  const navigate = useNavigate(); // 获取导航函数
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

  // 处理输入变化
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
      const backendUrl = 'http://10.158.36.225:8080/sign_up/'; // 后端注册接口占位符
      
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

        {registerSuccess ? (
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
          </form>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;