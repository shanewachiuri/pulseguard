import random
from langchain_core.tools import tool
from services.rag import KnowledgeService

# Initialize the RAG (Retrieval-Augmented Generation) service
# This loads the knowledge.txt file into memory so the AI can search it
knowledge_svc = KnowledgeService()

@tool
def fetch_kmd_weather_index(county: str) -> str:
    """Fetches the official Kenya Meteorological Department weather index for a county."""
    try:
        # --- YOUR EXISTING LOGIC HERE ---
        # (e.g., making an API request to a weather service)
        
        # For testing purposes right now, you can just force it to return a success string:
        return f"Verified: Heavy rainfall and severe flooding recorded in {county} over the last 7 days."
        
    except Exception as e:
        # Instead of crashing the server, return the error to the AI!
        return f"Warning: The weather API is currently down. Could not fetch data for {county}. Error details: {str(e)}"

@tool
def search_insurance_guidelines(query: str) -> str:
    """
    Searches the internal PulseGuard knowledge base for regulatory compliance, 
    coverage limits, pricing rules, and Service Level Agreements (SLAs). 
    ALWAYS use this tool to verify facts before answering policy questions.
    """
    # This triggers the KnowledgeService to search your knowledge.txt file
    return knowledge_svc.ask_knowledge_base(query)