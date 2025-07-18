import os

from dashscope import ImageSynthesis

from backed_end.config.api_key import OPEN_API_KEY


def get_picture(prompt:str):
    rsp = ImageSynthesis.call(api_key=OPEN_API_KEY,
                              model="wanx2.1-t2i-turbo",
                              prompt=prompt,
                              n=1,
                              size='1024*1024')
    return rsp