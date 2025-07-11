import { User } from "oidc-client";
import React ,{createContext, useContext,useState,useEffect} from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user,setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  //这里通过localStorage来持久化存储用户信息，并且
  const updateUser = (userData) => {
    setUser(userData);
    //要转化成字符串再存储
    localStorage.setItem('userInfo',JSON, stringify(userData));
  };
  
  //同理，来清空你刚才存储的用户信息
  const clearUser = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
  }
   
  //初始化时从LocalStorage 恢复用户信息
   useEffect(() => {
     const storedUser = localStorage.getItem('userInfo');
     if(storedUser) {
      setUser(JSON.parse(storedUser));
     }
     setLoading(false);
   }, []);

   return (
    <UserContext.Provider
     value={{
      user,
      loading,
      setLoading,
      updateUser,
      clearUser
     }}
     >
        <div>//这里可以先加入东西，然后把想要的东西卡在关键的位置，比如children    在别的地方用的时候呢，就是UserProvider 前后然后中间加东西，会放在我这个现在在定义的组建的位置上
         你的位置在这里
       {children}
       </div>

     </UserContext.Provider>

   )
  };

  export const useUser = () => {
    const context = useContext(UserContext);
    if(!context){
      throw new Error ('useUser must be used within a UserProvider');
    }
    return context;
  }