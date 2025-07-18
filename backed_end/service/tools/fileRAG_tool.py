from langchain_community.vectorstores import Neo4jVector
from langchain_huggingface import HuggingFaceEmbeddings
from neo4j import GraphDatabase

from backed_end.config.api_key import NEO4J_SECRET, NEO4J_URL


def RAG_tool(thread_id: str):
    # 创建唯一的索引名称和节点标签
    index_name = f"doc_index_{thread_id}"
    node_label = f"Document_{thread_id}"

    # Neo4j 连接配置
    url = NEO4J_URL
    username = "neo4j"
    password = NEO4J_SECRET

    # 1. 检查索引是否存在
    driver = GraphDatabase.driver(url, auth=(username, password))
    index_exists = False

    try:
        with driver.session() as session:
            # 检查向量索引是否存在
            result = session.run(
                "SHOW INDEXES WHERE name = $index_name AND type = 'VECTOR'",
                index_name=index_name
            )
            index_exists = bool(result.single())
    except Exception as e:
        print(f"Error checking index: {e}")
        return None
    finally:
        driver.close()

    if not index_exists:
        print(f"Index {index_name} does not exist for thread {thread_id}")
        return None

    # 2. 索引存在，创建检索器
    try:
        embeddings = HuggingFaceEmbeddings(
            model_name="../models/m3e-base-huggingface",
            model_kwargs={'device': "cpu"}
        )

        # 关键修复：使用正确的节点标签
        vector_index = Neo4jVector.from_existing_index(
            embedding=embeddings,
            index_name=index_name,
            url=url,
            username=username,
            password=password,
            node_label=node_label  # 添加节点标签
        )

        return vector_index.as_retriever()
    except Exception as e:
        print(f"Error creating retriever: {e}")
        return None