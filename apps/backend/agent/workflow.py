import os
from langchain_groq import ChatGroq
from .tools import fetch_kmd_weather_index, search_insurance_guidelines

# Initialize Groq LLM
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    print("⚠️ Warning: GROQ_API_KEY not found in environment.")

# CRITICAL FIX: Retaining the 8b-instant model to prevent the "model decommissioned" 400 error
llm = ChatGroq(model="llama-3.1-8b-instant", api_key=api_key)

# Toolkit
tools = [fetch_kmd_weather_index, search_insurance_guidelines]

# System prompt
system_prompt = """
You are the PulseGuard Underwriting Agent. 
You assess risk for Kenyan farmers and gig workers.
ALWAYS use the fetch_kmd_weather_index tool if the user mentions a location.
ALWAYS use the search_insurance_guidelines tool for policy rules.
Keep your answers extremely brief (under 150 characters) to fit on a USSD screen.
"""