import {message} from 'antd';

const useMessage = () => {
  const[messageApi, contextHolder] = message.useMessage();
  
  const showMessage = (type, text, duration=3) => {
    switch (type) {
      case 'success':
        messageApi.success(text, duration);
        break;
      case 'error':
        messageApi.error(text, duration);
        break;
      case 'warning':
        messageApi.warning(text, duration);
        break;
      case 'loading':
        messageApi.loading(text, duration)
        break;
      default:
        messageApi.info(text, duration);
        break;
    }
  };

  return  {contextHolder, showMessage };
  
  

};

export default useMessage;
