import os
import smtplib
from email.header import Header
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from langchain_community.document_transformers import DoctranTextTranslator

from backed_end.config.api_key import EMAIL, EMAIL_SECRET


def sendemail(email: str,thread_id:str) -> None:
    """
    Send an email using the configured SMTP server.

    Args:
        to (str): The recipient's email address.
        subject (str): The subject of the email.
        body (str): The body of the email.

    Returns:
        None
    """
    # This function is a placeholder for actual email sending logic.
    # In a real implementation, you would use an SMTP library to send the email.
    # 邮件内容
    subject = '请收取您的附件'
    body = '您要求生成的附件已生成，请收取您的附件'
    dir_path = os.path.join("../ai_generator_resource",thread_id)  # 附件路径（支持任意文件类型）
    # 构建邮件
    msg = MIMEMultipart()
    msg.attach(MIMEText(body, 'plain', 'utf-8'))
    msg['Subject'] = Header(subject, 'utf-8')
    msg['From'] = EMAIL
    msg['To'] = email

    # 发送邮件
    smtp_server = 'smtp.qq.com'
    smtp_port = 465
    sender_email = EMAIL
    password = EMAIL_SECRET  # 在QQ邮箱设置里拿到的码
    try:
        for filename in os.listdir(dir_path):
            file_path = os.path.join(dir_path, filename)
            with open(file_path, "rb") as attachment:
                part = MIMEApplication(attachment.read())
                part.add_header(
                    "Content-Disposition",
                    "attachment",
                    filename=Header(filename, "utf-8").encode()  # 设置显示的文件名
                )
                msg.attach(part)
    except FileNotFoundError:
        print(f"错误：附件文件 '{file_path}' 未找到！")
        exit()

    try:
        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(sender_email, password)
            server.sendmail(sender_email, [msg['To']], msg.as_string())
        print('邮件发送成功')
    except smtplib.SMTPException as e:
        print('邮件发送失败:', e)

if __name__ == "__main__":
    sendemail("yinghechaopin@163.com","2")

