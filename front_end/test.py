import requests
import json

# SillyTavern OpenAI兼容API地址
API_URL = "http://127.0.0.1:5100/v1/chat/completions"

# 认证：任意非空密钥
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk-1e3e3002b4b34f9b92169cd0fa9db9e7"
}

# 请求体
payload = {
    "model": "deepseek-reasoner",  # 和 SillyTavern 配置一致
    "messages": [
        {"role": "user", "content": "写一首描写春天的古风诗"}
    ],
    "temperature": 0.7,
    "max_tokens": 1024
}

# 发送请求
response = requests.post(API_URL, headers=headers, data=json.dumps(payload))

# 解析返回
if response.status_code == 200:
    result = response.json()
    print(result['choices'][0]['message']['content'])
else:
    print("请求失败:", response.status_code, response.text)
