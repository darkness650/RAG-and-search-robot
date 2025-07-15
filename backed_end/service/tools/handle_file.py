import os
from langchain_community.document_loaders import TextLoader, Docx2txtLoader, PyPDFLoader
from langchain_community.vectorstores import Neo4jVector
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from neo4j import GraphDatabase


def handle_file(thread_id):
    # 设置文件目录
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
        chunk_size=1500,
        chunk_overlap=300,
        separators=["\n\n", "\n", "。", "！", "？"]
    )
    chunked_docs = text_splitter.split_documents(docs)

    # 创建唯一的索引名称（基于thread_id）
    index_name = f"doc_index_{thread_id}"

    # 创建embedding模型
    embeddings = HuggingFaceEmbeddings(
        model_name="../models/m3e-base-huggingface",
        model_kwargs={'device': "cpu"}
    )

    # Neo4j连接配置
    neo4j_url = "bolt://localhost:7687"
    neo4j_username = "neo4j"
    neo4j_password = "Aa17526909261"

    # 为每个文档块添加thread_id元数据
    for doc in chunked_docs:
        doc.metadata["thread_id"] = thread_id

    # 关键修复：手动创建索引和约束
    driver = GraphDatabase.driver(neo4j_url, auth=(neo4j_username, neo4j_password))

    try:
        # 1. 创建唯一性约束
        with driver.session() as session:
            session.run(
                f"CREATE CONSTRAINT IF NOT EXISTS FOR (n:`Document_{thread_id}`) REQUIRE n.id IS UNIQUE"
            )

        # 2. 创建向量索引
        with driver.session() as session:
            session.run(
                f"CREATE VECTOR INDEX {index_name} IF NOT EXISTS "
                f"FOR (n:`Document_{thread_id}`) ON n.embedding "
                "OPTIONS {indexConfig: {"
                "  `vector.dimensions`: 768, "
                "  `vector.similarity_function`: 'cosine'"
                "}}"
            )
    finally:
        driver.close()

    # 3. 创建向量存储
    vector_index = Neo4jVector.from_documents(
        documents=chunked_docs,
        embedding=embeddings,
        url=neo4j_url,
        username=neo4j_username,
        password=neo4j_password,
        index_name=index_name,
        node_label=f"Document_{thread_id}",  # 关键：使用带thread_id的标签
        text_node_property="text",
        embedding_node_property="embedding",
        pre_delete_collection=False
    )

    print(f"Added {len(chunked_docs)} chunks to index {index_name} for thread {thread_id}")