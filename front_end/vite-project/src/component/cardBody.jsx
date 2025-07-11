import {Button,Popconfirm,Flex, Card } from "antd";
import {useNavigate} from "react-router-dom";
import React from "react";

const CardBody = ({
  title,
  children,
  footer,
  extra = true,
}) => {

  const navigate = useNavigate();

  const renderExtra = () => {
    
    if(!extra) return null;

    if(React.isValidElement(extra)) return extra;
                                  
    return(
      <Popconfirm
      placement="bottomRight"
      title={"是否确认返回"}
      description={"此返回页面数据将不会保存，如果需要暂存，请点击暂存按钮"}
      okText="确认"
      cancelText="取消"
      onConfirm={() => navigate("/")}
     >
      <Button>返回</Button>
     </Popconfirm>
    )
  };

  return (
    <Card
      style={{
        height: '100%',
        display: 'flex',
        flexDirection:'column'
      }}
      styles={{
        body:{
          flex:1,
          overflow:'auto',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    
     title={title}
     extra={renderExtra()}   
  >
  {children}
  <Flex justify="center" align="center" gap="small">
    {footer}
  </Flex>




    </Card>
  )





    
  };
  export default CardBody;