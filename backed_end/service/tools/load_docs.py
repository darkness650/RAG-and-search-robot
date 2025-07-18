import os

from langchain_community.document_loaders import Docx2txtLoader, PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter


def load_docs(thread_id:str):
    dir_path = os.path.join("../resource", thread_id)
    if not os.path.exists(dir_path):
        print(f"No directory found for thread {thread_id}")
        return

    # 加载所有支持的文件
    docs = []
    for filename in os.listdir(dir_path):
        file_path = os.path.join(dir_path, filename)
        try:
            if filename.endswith(".txt"):
                loader = TextLoader(file_path, encoding="utf-8")
                docs.extend(loader.load())
            elif filename.endswith(".docx"):
                loader = Docx2txtLoader(file_path)
                docs.extend(loader.load())
            elif filename.endswith(".pdf"):
                loader = PyPDFLoader(file_path)
                docs.extend(loader.load())
        except Exception as e:
            print(f"Error loading {file_path}: {str(e)}")

    if not docs:
        print(f"No valid documents found for thread {thread_id}")
        return

    # 分割文档
    text_splitter = RecursiveCharacterTextSplitter(
        separators=["\n\n", "\n"]
    )
    chunked_docs = text_splitter.split_documents(docs)
    return chunked_docs