import React from "react";
import Upload from "antd/es/upload/Upload";
import { UploadOutlined } from "@ant-design/icons";
import axios from 'axios';

export const ERROR_MESSAGES = {
  'file size exceed limit': '文件大小超出限制',
  'invalid file type': '无效的文件类型',
  'upload failed':'上传失败',
  'file already exists':'文件已存在',
  'permission denied':'没有权限',
};

const CustomUpload = ({
  id,
  type,
  text = "上传",
  accept,
  maxSize=50,
  onSuccess,
  onError,
  className,
  style
}) => {
  const beforeUpload = (file) => {
    const isLtMaxSize = file.size/1024/1024<maxSize;
    if(!isLtMaxSize){
      onError?.({message:`文件必须小于${maxSize}MB!`});
      return false;
    }
    return true;
  };

  const CustomRequest = async ({file, onSuccess:uploadSuccess,onError: uploadError}) =>{
    const formData =new FormData();
    formData.append('file', file);

    try{
      const response = await axios({
        method:'post',
        url:``,
        data:formData,
        headers:{
          'Accept':'application/json',
          'Accept-Language':'zh-CN,zh;q=0.9',
        },
        withCredentials:true,//允许携带跨域cookie
        decompress:true, //启动响应解压
        validateStatus:function(status){
          return status>=200&&status<300;
        },
      });//状态码检验

      if(response.status === 200) {
        uploadSuccess(response.data)
        onSuccess?.(response.data)

      }else{
        throw new Error('上传失败')
      }
    }catch(error) {
      let errorMessage = '上传失败';

      if(axios.isAxiosError(error)&&error.response?.data?.message) {
        const backendMessage = error.response.data.message;
        errorMessage  = ERROR_MESSAGES
        [backendMessage] ||backendMessage;
      }

      uploadError(error);
      onError?.({message:errorMessage});
    }
  };

  return (
    
    <Upload
     customRequest={customRequest}//自定义上传请求的逻辑
     showUploadList = {false}//是否显示上传列表
     beforeUpload={beforeUpload}//上传之前验证的逻辑
     accept={accept}//限制可选择的文件类型
     className={className}//类名
     style={style}
     
    >
      <a>
        <UploadOutlined /> {text}
      </a>
   




    </Upload>
    
);
}

export default CustomUpload

