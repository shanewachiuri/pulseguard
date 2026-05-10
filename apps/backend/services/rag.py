import os
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings, StorageContext
from llama_index.vector_stores.postgres import PGVectorStore
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

# 1. Configure LlamaIndex to use the OpenAI connector pointing at Groq's servers
# Switched to 8b-instant to resolve the "model decommissioned" 400 error
Settings.llm = OpenAI(
    model="llama-3.1-8b-instant", 
    api_key=os.getenv("GROQ_API_KEY"),
    api_base="https://api.groq.com/openai/v1"
)
Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

class KnowledgeService:
    def __init__(self):
        # 2. Connect to our existing Docker PostgreSQL database
        self.vector_store = PGVectorStore.from_params(
            database="pulseguard",
            host="localhost",
            password="pulseguard_dev",
            port=5433,
            user="postgres",
            table_name="insurance_knowledge",
            embed_dim=384,  # Matches the dimension of the bge-small-en-v1.5 model
        )
        self.storage_context = StorageContext.from_defaults(vector_store=self.vector_store)

        # 3. Load our local text files into the database (Upsert)
        docs = SimpleDirectoryReader("agent", required_exts=[".txt"]).load_data()
        self.index = VectorStoreIndex.from_documents(docs, storage_context=self.storage_context)
        self.query_engine = self.index.as_query_engine()

    def ask_knowledge_base(self, query: str) -> str:
        return str(self.query_engine.query(query))