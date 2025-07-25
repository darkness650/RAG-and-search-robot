import React from 'react';
import './UserTable.css'; 

const userData = [
  {
    "phone_number": null,
    "email": null,
    "hashed_password": "$2b$12$MWoQv8VZ.uKXzZLLRRyp9.eCMFNTdmw9Qiki6MbRMjYSHLNRPBo7G",
    "role": "user",
    "disabled": false,
    "username": "2325307358"
  },
  {
    "phone_number": null,
    "email": null,
    "hashed_password": "$2b$12$09hlSJj0Ft5LEQToU7wOOeYHIZh.9YlEbv0QbHRT4LcxIaGhhyDJy",
    "role": "user",
    "disabled": false,
    "username": "2325307359"
  },
  {
    "phone_number": null,
    "email": null,
    "hashed_password": "$2b$12$D75gpm98pLp8ZDSfUtaBWequeWNYZs5LafdGOC3FP8zZsa4A7ZTiy",
    "role": "user",
    "disabled": false,
    "username": "2910834819"
  },
  {
    "phone_number": "string",
    "email": "string",
    "hashed_password": "$2b$12$ikk77e3ihR/tbGhsVAofS.sNkSikqg0CVAzG.GcgTpW7DoKi/QATG",
    "role": "admin",
    "disabled": false,
    "username": "admin"
  },
  {
    "phone_number": "string",
    "email": "string",
    "hashed_password": "$2b$12$kTe9ErAnDKSxXsUuQQpGQOy/2mQh6Mf8cq1NK6.jLexHXiKYbjIg2",
    "role": "user",
    "disabled": false,
    "username": "darkness"
  },
  {
    "phone_number": "string",
    "email": "873319973@qq.com",
    "hashed_password": "$2b$12$/T0TPrw69.qxLfoUwNj8u.aKnxyyubot9ZZ56m27wDAtkEVGpbfJ6",
    "role": "user",
    "disabled": false,
    "username": "string"
  }
];

const UserTable = () => {
  // 虚假操作函数（提示用户功能暂未实现）
  const fakeEdit = () => alert('修改功能暂未开发，请期待～');
  const fakeDelete = () => alert('删除功能暂未开发，别慌～');

  return (
    <div className="table-wrapper">
      <table className="user-table">
        <thead>
          <tr>
            <th>用户名</th>
            <th>邮箱</th>
            <th>手机号</th>
            <th>角色</th>
            <th>禁用状态</th>
            <th>密码哈希</th>
            <th>操作</th> {/* 新增操作列 */}
          </tr>
        </thead>
        <tbody>
          {userData.map((user, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
              <td>{user.username}</td>
              <td>{user.email ?? '无'}</td>
              <td>{user.phone_number ?? '无'}</td>
              <td>{user.role}</td>
              <td>{user.disabled ? '是' : '否'}</td>
              <td className="hash-column">{user.hashed_password}</td>
              {/* 操作列：修改 + 删除按钮 */}
              <td className="action-column">
                <button className="edit-btn" onClick={fakeEdit}>修改</button>
                <button className="delete-btn" onClick={fakeDelete}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;