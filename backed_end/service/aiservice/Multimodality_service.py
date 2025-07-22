import base64
import os
from openai import OpenAI
from backed_end.config.api_key import WANX_API_KEY
import numpy as np
import soundfile as sf

def encode_file(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def mutimodaity_service(thread_id: str, question: str, audio:bool=False):
    client = OpenAI(
        api_key=WANX_API_KEY,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    )

    dir_path = os.path.join("../resource", thread_id)
    media_content = None
    output_format=["text"]
    if audio:
        output_format.append("audio")
    # 查找目录中的第一个文件
    for filename in os.listdir(dir_path):
        file_path = os.path.join(dir_path, filename)
        data_type = filename.split(".")[-1].lower()

        # 只处理找到的第一个文件
        base64_data = encode_file(file_path)

        if data_type in ["png", "jpg", "jpeg"]:
            media_content = {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/{data_type};base64,{base64_data}"
                }
            }
        elif data_type in ["mp3", "wav"]:
            media_content = {
                "type": "input_audio",
                "input_audio": {
                    "data": f"data:;base64,{base64_data}",
                    "format": data_type
                }
            }
        elif data_type == "mp4":
            media_content = {
                "type": "video_url",
                "video_url": {
                    "url": f"data:;base64,{base64_data}"
                }
            }
        break  # 处理第一个文件后退出循环

    # 构建消息内容
    content_list = []

    if media_content:
        content_list.append(media_content)

    content_list.append({"type": "text", "text": question})

    # 创建消息
    messages = [{
        "role": "user",
        "content": content_list
    }]

    # 调用 API
    completion = client.chat.completions.create(
        model="qwen-omni-turbo",
        messages=messages,
        modalities=output_format,
        audio={"voice": "Cherry", "format": "wav"},
        stream=True,
        stream_options={"include_usage": True},
    )

    output = str()
    if not audio:
        for chunk in completion:
            if chunk.choices and hasattr(chunk.choices[0].delta, "audio"):
                if chunk.choices[0].delta.audio:
                    output += (chunk.choices[0].delta.audio["transcript"])
        return output
    else:
        for chunk in completion:
            if chunk.choices:
                if hasattr(chunk.choices[0].delta, "audio"):
                    try:
                        output += chunk.choices[0].delta.audio["data"]
                    except Exception as e:
                        print(chunk.choices[0].delta.audio["transcript"])
            else:
                print(chunk.usage)

        wav_bytes = base64.b64decode(output)
        audio_np = np.frombuffer(wav_bytes, dtype=np.int16)
        sf.write(f"../ai_generator_resource/{thread_id}/generate.wav", audio_np, samplerate=24000)

if __name__ == '__main__':
    print(mutimodaity_service("1", "帮我描述一下这张图片",True))