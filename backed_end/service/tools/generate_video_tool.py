import json
import os
from http import HTTPStatus

from dashscope import VideoSynthesis

from backed_end.config.api_key import WANX_API_KEY


def get_video_tool(input_str:str):
    data=json.loads(input_str)
    thread_id=data['thread_id']
    question=data['question']
    dir_path=f"../resource/{thread_id}"
    if(len(os.listdir(dir_path))>0):
        for filename in os.listdir(dir_path):
            img_url ="file://" + dir_path + "/" + filename
    #print(img_url)
        rsp = VideoSynthesis.call(api_key=WANX_API_KEY,
                                  model='wanx2.1-i2v-turbo',
                                  prompt=question,
                                  # template='flying',
                                  img_url=img_url)
    else:
        rsp = VideoSynthesis.call(api_key=WANX_API_KEY,
                                  model='wanx2.1-t2v-turbo',
                                  prompt=question,
                                  )
    print(rsp)
    if rsp.status_code == HTTPStatus.OK:
        print(rsp.output.video_url)
    else:
        print('Failed, status_code: %s, code: %s, message: %s' %
              (rsp.status_code, rsp.code, rsp.message))
    return rsp
