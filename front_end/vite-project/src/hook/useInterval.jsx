import { useEffect,useRef } from "react";

//在这里定义一个hook：useInterval 
export const useInterval = (callback, delay) => {
  const savedCallback=useRef();

  //在callback函数改变的时候存入savedCallback里面
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
   
  //分两部分，一部分是主要，另一部分是清理函数  
  //id就是用来清理的。
  useEffect(() => {
    if(delay !==null){
      const id = setInterval(() => savedCallback.current(),delay);
      return () => clearInterval(id);
    }
  }, [delay])
};