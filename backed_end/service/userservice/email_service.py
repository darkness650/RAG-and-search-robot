import os
import smtplib
from email.header import Header
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from backed_end.config.api_key import EMAIL, EMAIL_SECRET


def sendemail(email: str,subject:str,body:str) -> None:
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
        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(sender_email, password)
            server.sendmail(sender_email, [msg['To']], msg.as_string())
        print('邮件发送成功')
    except smtplib.SMTPException as e:
        print('邮件发送失败:', e)