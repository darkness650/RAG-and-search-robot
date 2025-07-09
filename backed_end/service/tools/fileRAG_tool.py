import os

from langchain_community.document_loaders import TextLoader
from langchain_community.document_loaders import Docx2txtLoader
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 文档检索工具函数
def RAG_tool(thread_id:str):
    dir=r"../resource/"+thread_id+"/"
    os.makedirs(os.path.dirname(dir), exist_ok=True)
    docs=[]
    for filename in os.listdir(dir):
        file_path = os.path.join(dir, filename)
        if file_path.endswith(".txt"):
            loader=TextLoader(file_path,encoding="utf-8")
            docs.extend(loader.load())
        elif file_path.endswith(".docx"):
            loader = Docx2txtLoader(file_path)
            docs.extend(loader.load())
        elif file_path.endswith(".pdf"):
            loader = PyPDFLoader(file_path)
            docs.extend(loader.load())
    splits=RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunked_docs=splits.split_documents(docs)
    embeddings = OpenAIEmbeddings(
        api_key=os.getenv("ZHIPU_API_KEY"),
        base_url="https://open.bigmodel.cn/api/paas/v4",
        model="embedding-3",
    )
    vectordb = Chroma.from_documents(chunked_docs, embeddings)
    # 创建文档检索器
    retriever = vectordb.as_retriever()
    return retriever