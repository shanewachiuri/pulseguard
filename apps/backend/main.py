from utils.telemetry import setup_telemetry, tracer
from opentelemetry import trace

import secrets
from fastapi import BackgroundTasks # NEW
from services.webhook import dispatch_webhook # NEW
import os
import traceback
import hashlib # NEW: Imported for API key hashing

import sys
import asyncio

# --- WINDOWS ASYNCIO FIX FOR POSTGRES ---
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


# HACK: Fixes PyTorch OS username crash on Windows
os.environ.setdefault("USER", "pulseguard_admin")

import shutil
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from prisma import Prisma
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Rate Limiting Imports
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# LangGraph & DB Pool Imports
from psycopg_pool import AsyncConnectionPool
from contextlib import asynccontextmanager
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.prebuilt import create_react_agent

# Load .env before importing workflows or services that require credentials
load_dotenv()

from agent.workflow import llm, tools, system_prompt
from services.mpesa import MpesaService
from services.vision import VisionService
from services.parametric import run_parametric_evaluation
from services.blockchain import BlockchainService  # NEW: Imported the Blockchain Service

# New Privacy Imports
from utils.privacy import sanitize_input_for_llm, mask_kenyan_phone

# NEW: Import the embedded API router
from routers import embedded

# Initialize Core Services
db = Prisma()
mpesa_svc = MpesaService()
vision_svc = VisionService()
blockchain_svc = BlockchainService()  # NEW: Initialized the Blockchain Service
scheduler = AsyncIOScheduler()

# Initialize Rate Limiter (tracks via user IP address)
limiter = Limiter(key_func=get_remote_address)

# Connection pool for LangGraph memory
raw_uri = os.getenv("DATABASE_URL", "").replace("postgresql://", "postgres://")
clean_uri = raw_uri.split("?")[0]
connection_pool = AsyncConnectionPool(conninfo=clean_uri, max_size=10, kwargs={"autocommit": True}, open=False)

pulse_engine = None

# Manage database connection and background tasks
@asynccontextmanager
async def lifespan(app: FastAPI):
    global pulse_engine
    
    # ==========================================
    # --- STARTUP PHASE (Runs before server starts) ---
    # ==========================================
    print("🚀 Booting up PulseGuard API...")
    
    # 1. Connect Databases
    await db.connect()
    await connection_pool.open()
    app.state.db = db

    # 2. Setup TimescaleDB
    try:
        await db.execute_raw("""
            SELECT create_hypertable('"Telematics"', 'timestamp', if_not_exists => TRUE);
        """)
        print("📈 TimescaleDB Hypertable 'Telematics' ready.")
    except Exception as e:
        print(f"⚠️ Hypertable notice: {e}")

    # 3. Setup AI Memory Checkpointer
    checkpointer = AsyncPostgresSaver(connection_pool)
    await checkpointer.setup()
    print("🧠 LangGraph Memory Checkpointer Initialized.")

    # 4. Compile AI Agent with persistent memory
    pulse_engine = create_react_agent(llm, tools, prompt=system_prompt, checkpointer=checkpointer)

    # 5. Start Background Scheduler (Parametric Evaluation)
    scheduler.add_job(run_parametric_evaluation, 'interval', minutes=1, args=[db, mpesa_svc, blockchain_svc])
    scheduler.start()
    print("⏱️ Background Scheduler Started: Parametric Evaluation active.")

    # ==========================================
    # SERVER RUNNING
    # ==========================================
    yield # The app pauses here and serves incoming requests

    # ==========================================
    # --- SHUTDOWN PHASE (Runs on exit) ---
    # ==========================================
    print("🛑 Shutting down gracefully...")
    
    scheduler.shutdown()
    await connection_pool.close()
    await db.disconnect()
    
    print("🛑 Services shut down securely.")


# --- FastAPI App Definition ---
app = FastAPI(
    title="PulseGuard Embedded Insurance API",
    description="""
    The API for B2B partners to seamlessly embed parametric and usage-based insurance into their checkout flows.

    **Core Features:**
    * Instant Policy Issuance
    * M-Pesa STK Push Integration
    * Automated Webhook Notifications
    """,
    version="1.0.0",
    contact={
        "name": "PulseGuard Developer Support",
        "url": "https://pulseguard.co.ke/developers",
        "email": "api@pulseguard.co.ke",
    },
    lifespan=lifespan
)
setup_telemetry(app) # NEW: Initialize OTel instrumentation

# Register Rate Limiter and its Exception Handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS for our Monorepo Frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "exp://localhost:8081", "http://localhost:8081"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NEW: Register the embedded API router
app.include_router(embedded.router)


# --- PYDANTIC MODELS ---

class PulseRequest(BaseModel):
    phone: str
    input_data: str

class PaymentRequest(BaseModel):
    phone: str
    amount: int
    policy_id: str

class TelematicsPayload(BaseModel):
    phone: str
    latitude: float
    longitude: float
    speed: float

# --- ROUTES ---

@app.get("/")
def read_root():
    return {"status": "online", "service": "Pulse Engine Core"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Apply Rate Limit: Max 5 requests per minute per IP
@app.post("/engine/pulse")
@limiter.limit("5/minute")
async def run_pulse_engine(request: Request, req: PulseRequest):
    print(f"\n🚀 --- NEW REQUEST RECEIVED FOR {req.phone} ---")
    
    try:
        # Start a compliance-grade trace span
        with tracer.start_as_current_span("ai_underwriting_decision") as span:
            
            # 1. Privacy Masking
            safe_input = sanitize_input_for_llm(req.input_data, req.phone)
            masked_phone = mask_kenyan_phone(req.phone)
            
            # KDPA COMPLIANCE: Never put raw PII in telemetry spans
            span.set_attribute("compliance.masked_phone", masked_phone)
            print(f"🔒 Privacy applied: Sending request as {masked_phone}")

            # 2. AI Analysis via LangGraph (With memory!)
            print("🧠 1. Waking up LangGraph AI Engine with Memory...")
            config = {"configurable": {"thread_id": req.phone}}
            inputs = {"messages": [HumanMessage(content=f"User {masked_phone} says: {safe_input}")]}

            # Use ainvoke because the checkpointer is async
            response = await pulse_engine.ainvoke(inputs, config=config)
            final_message = response["messages"][-1].content
            print("✅ AI Engine finished successfully!")
            
            # Capture reasoning as metadata for AI compliance
            span.set_attribute("ai.decision_summary", final_message[:100])

            # 3. Database Persistence (Use RAW phone here for the database!)
            print("💾 2. Connecting to PostgreSQL Database...")
            user = await db.user.upsert(
                where={"phone": req.phone},
                data={"create": {"phone": req.phone}, "update": {}}
            )
            print(f"👤 User upserted: {user.id}")

            policy = await db.micropolicy.create(
                data={
                    "userId": user.id,
                    "pulseScore": 75,
                    "coverageType": "Parametric Climate",
                    "premiumAmount": 50.0,
                    "assessmentText": final_message
                }
            )
            print(f"📜 Policy created: {policy.id}")

            return {
                "phone": masked_phone,
                "policy_id": policy.id,
                "assessment": final_message
            }
            
    except Exception as e:
        print("\n❌ ❌ ❌ FATAL ERROR CAUGHT ❌ ❌ ❌")
        import traceback
        traceback.print_exc()
        raise e

@app.post("/telematics/ingest")
async def ingest_telematics(payload: TelematicsPayload):
    record = await db.telematics.create(
        data={
            "phone": payload.phone,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "speed": payload.speed
        }
    )
    if payload.speed > 80.0:
        print(f"⚠️ HIGH SPEED ALERT: {payload.phone} traveling at {payload.speed} km/h. Premium discount revoked.")
    return {"status": "ingested", "id": record.id}

@app.post("/payments/trigger")
async def trigger_premium_payment(req: PaymentRequest):
    formatted_phone = req.phone if not req.phone.startswith("0") else "254" + req.phone[1:]
    response = await mpesa_svc.initiate_stk_push(
        phone=formatted_phone, amount=req.amount, account_reference=req.policy_id
    )
    return response

@app.post("/mpesa/callback")
async def mpesa_callback(payload: dict, background_tasks: BackgroundTasks):
    result_code = payload.get("Body", {}).get("stkCallback", {}).get("ResultCode")

    if result_code == 0:
        print("✅ M-Pesa Payment Successful!")

        # Find the partner linked to this payment to notify them
        policy = await db.micropolicy.find_first(
            where={"partnerId": {"not": None}},
            include={"partner": True}
        )

        if policy and policy.partner and policy.partner.webhookUrl:
            background_tasks.add_task(
                dispatch_webhook,
                policy.partner.webhookUrl,
                policy.partner.webhookSecret, # NEW
                "policy.payment_collected",
                {"policy_id": policy.id, "status": "active"}
            )
    else:
        print(f"❌ Payment Failed or Cancelled. Code: {result_code}")

    return {"ResultCode": 0, "ResultDesc": "Callback received successfully"}


# ==========================================
# M-PESA C2B (PAYBILL) ROUTES
# ==========================================

# 3. M-Pesa C2B Validation (Pre-Payment Check)
@app.post("/mpesa/c2b/validation")
async def c2b_validation(payload: dict):
    # Safaricom asks: "Should we accept this money?"
    bill_ref = payload.get("BillRefNumber", "")

    # Check if the user typed a valid Policy ID as their Account Number
    policy = await db.micropolicy.find_unique(where={"id": bill_ref})

    if not policy:
        # Reject payment: Invalid account number. The user's M-Pesa balance is not deducted.
        print(f"⚠️ C2B Rejected: Unknown Policy ID {bill_ref}")
        return {"ResultCode": 1, "ResultDesc": "Rejected: Invalid Policy ID"}

    print(f"✅ C2B Validated: Policy ID {bill_ref} exists.")
    return {"ResultCode": 0, "ResultDesc": "Accepted"}

# 4. M-Pesa C2B Confirmation (Post-Payment Activation)
@app.post("/mpesa/c2b/confirmation")
async def c2b_confirmation(payload: dict, background_tasks: BackgroundTasks):
    # Safaricom says: "The money has successfully landed in your Paybill."
    bill_ref = payload.get("BillRefNumber", "")

    try:
        # Mark the policy as officially active
        # PROACTIVE BUG FIX: Added "user": True so we can access policy.user.phone for the blockchain payload
        policy = await db.micropolicy.update(
            where={"id": bill_ref},
            data={"isActive": True},
            include={"partner": True, "user": True} 
        )

        print(f"🎉 C2B Confirmed! Policy {bill_ref} is now ACTIVE.")

        # NEW: Record the premium in our digital chama ledger on Polygon
        try:
            amount_paid = int(float(payload.get("TransAmount", 0)))
            pool_tx = blockchain_svc.record_pool_premium("chama-nairobi-01", policy.user.phone, amount_paid)
            print(f"🤝 Chama Pool Ledger Updated! Tx Hash: {pool_tx}")
        except Exception as e:
            print(f"⚠️ Pool ledger update failed: {e}")

        # If this was an embedded B2B policy, notify the partner immediately!
        if policy and policy.partner and policy.partner.webhookUrl:
            background_tasks.add_task(
                dispatch_webhook,
                policy.partner.webhookUrl,
                policy.partner.webhookSecret, 
                "policy.activated_via_c2b",
                {"policy_id": policy.id, "amount_paid": payload.get("TransAmount")}
            )
            
    except Exception as e:
        print(f"❌ C2B Confirmation DB Error: {e}")

    # You MUST return 0 to Safaricom, otherwise they will keep retrying this request every few hours
    return {"ResultCode": 0, "ResultDesc": "Success"}


@app.post("/claims/upload")
async def process_claim_image(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    try:
        result = vision_svc.analyze_damage(temp_path)
        status = "APPROVED_FOR_PAYOUT" if result.get("is_damaged") else "MANUAL_REVIEW"
        return {"filename": file.filename, "status": status, "vision_analysis": result}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

# --- NEW B2C WEBHOOKS ---

@app.post("/mpesa/b2c/result")
async def b2c_result(payload: dict):
    # Safaricom sends the final B2C completion status here
    result_code = payload.get("Result", {}).get("ResultCode")
    if result_code == 0:
        print("✅ B2C Payout Successfully Delivered to User Wallet!")
    else:
        print(f"❌ B2C Payout Failed: {payload}")
    return {"ResultCode": 0, "ResultDesc": "Accepted"}

@app.post("/mpesa/b2c/timeout")
async def b2c_timeout(payload: dict):
    print("⚠️ B2C Payout Timed Out at Safaricom")
    return {"ResultCode": 0, "ResultDesc": "Accepted"}

@app.get("/dashboard/{phone}")
async def get_dashboard_data(phone: str):
    # Find the user
    user = await db.user.find_unique(where={"phone": phone})
    if not user:
        return {"pulseScore": 0, "policy": None}

    # Fetch their most recent active policy
    policy = await db.micropolicy.find_first(
        where={"userId": user.id, "isActive": True},
        order={"createdAt": "desc"}
    )

    return {
        "pulseScore": policy.pulseScore if policy else 0,
        "policy": policy.model_dump() if policy else None
    }

class PartnerSetupRequest(BaseModel):
    webhook_url: str

@app.post("/setup-test-partner")
async def setup_test_partner(req: PartnerSetupRequest):
    raw_key = "test_partner_key_123"
    hashed_key = hashlib.sha256(raw_key.encode()).hexdigest()
    webhook_secret = secrets.token_hex(32) # Secure 64-character hex string

    await db.partner.upsert(
        where={"name": "AgriTech Co"},
        data={
            "create": {"name": "AgriTech Co", "apiKeyHash": hashed_key, "webhookUrl": req.webhook_url, "webhookSecret": webhook_secret},
            "update": {"apiKeyHash": hashed_key, "webhookUrl": req.webhook_url, "webhookSecret": webhook_secret}
        }
    )
    return {"message": "Test partner created", "your_api_key": raw_key, "webhook_secret": webhook_secret}