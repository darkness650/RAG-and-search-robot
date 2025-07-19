from dashscope import ImageSynthesis

from dashscope import ImageSynthesis

from backed_end.config.api_key import WANX_API_KEY


def get_picture(prompt:str):
    rsp = ImageSynthesis.call(api_key=WANX_API_KEY,
                              model="wanx2.1-t2i-plus",
                              prompt=prompt,
                              n=1,
                              size='1024*1024')
    return rsp