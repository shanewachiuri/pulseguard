import os
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings, StorageContext
from llama_index.vector_stores.postgres import PGVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

# 👇 NEW IMPORT 👇
from llama_index.llms.openai_like import OpenAILike

# 👇 USE OpenAILike INSTEAD OF OpenAI 👇
Settings.llm = OpenAILike(
    model="llama-3.1-8b-instant",
    api_key=os.getenv("GROQ_API_KEY"),
    api_base="https://api.groq.com/openai/v1",
    is_chat_model=True,
    context_window=8192
)
Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

class KnowledgeService:
    def __init__(self):
        # Connect dynamically based on environment (CI vs Local)
        self.vector_store = PGVectorStore.from_params(
            database=os.getenv("VECTOR_DB_NAME", "pulseguard"),
            host=os.getenv("VECTOR_DB_HOST", "localhost"),
            password=os.getenv("VECTOR_DB_PASSWORD", "pulseguard_dev"),
            port=int(os.getenv("VECTOR_DB_PORT", "5433")),
            user=os.getenv("VECTOR_DB_USER", "postgres"),
            table_name="insurance_knowledge",
            embed_dim=384,
        )
        self.storage_context = StorageContext.from_defaults(vector_store=self.vector_store)

        # Load our local text files into the database (Upsert)
        docs = SimpleDirectoryReader("agent", required_exts=[".txt"]).load_data()
        self.index = VectorStoreIndex.from_documents(docs, storage_context=self.storage_context)
        self.query_engine = self.index.as_query_engine()

    def ask_knowledge_base(self, query: str) -> str:
        return str(self.query_engine.query(query))