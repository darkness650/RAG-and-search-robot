import React, {useState} from 'react';
import {Avatar, Dropdown, Menu, message}from 'antd';
import { LogoutOutlined } from '@ant-design/icons';

//登录头像组件
const UserAvatar = ({user, onLogout}) => {
  const [visible ,setVisible]=useState(false);

  const handleLogout = () => {
    onLogout();
    message.success('退出登陆成功');

  };


  //下拉菜单内容渲染函数
  const menuRender = () => {
    <Menu onClick={({key}) => {
      if(key==='logout'){
        handleLogout();
      }
    }}>
     <Menu.Item key="logout" icon=
      {<LogoutOutlined />}>
      退出登录
      </Menu.Item>
    </Menu>
  };
   
  return (
    <Dropdown
    overlay={menuRender}
    trigger={['click']}
    open={visible}
    onVisibleChange={(newVisible) => {
      setVisible(newVisible);
    }}
    >
    <div style={{display:'flex',alignItems:'center',cursor:'pointer'}}>
      <Avatar src={user?.avatar_resource_url}
      style={{marginRight:20}} />


    </div>



    </Dropdown>
  )

}
export default UserAvatar;