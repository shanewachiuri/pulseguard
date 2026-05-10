from fastapi import APIRouter, Header, HTTPException, Depends, Request
from pydantic import BaseModel
import hashlib
import traceback
from services.mpesa import MpesaService

router = APIRouter(prefix="/api/v1/embedded", tags=["Embedded Insurance"])
mpesa_svc = MpesaService()

class EmbeddedPolicyRequest(BaseModel):
    phone: str
    coverageType: str
    premiumAmount: float
    contextData: str

async def verify_api_key(request: Request, x_api_key: str = Header(...)):
    try:
        db = request.app.state.db
        hashed_key = hashlib.sha256(x_api_key.encode()).hexdigest()
        partner = await db.partner.find_unique(where={"apiKeyHash": hashed_key})
        
        if not partner:
            raise HTTPException(status_code=401, detail="Invalid or missing API Key")
        return partner
    except HTTPException:
        raise
    except Exception as e:
        print("\n❌ API KEY VERIFICATION ERROR:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal Server Error during Key Verification")

@router.post("/issue-policy")
async def issue_embedded_policy(request: Request, req: EmbeddedPolicyRequest, partner=Depends(verify_api_key)):
    try:
        db = request.app.state.db
        
        user = await db.user.upsert(
            where={"phone": req.phone},
            data={"create": {"phone": req.phone}, "update": {}}
        )

        policy = await db.micropolicy.create(
            data={
                "userId": user.id,
                "partnerId": partner.id, # NEW: Link to partner
                "pulseScore": 80,
                "coverageType": req.coverageType,
                "premiumAmount": req.premiumAmount,
                "assessmentText": f"Embedded policy auto-approved via {partner.name}: {req.contextData}"
            }
        )

        formatted_phone = req.phone
        if formatted_phone.startswith("0"):
            formatted_phone = "254" + formatted_phone[1:]

        try:
            await mpesa_svc.initiate_stk_push(
                phone=formatted_phone,
                amount=int(req.premiumAmount),
                account_reference=policy.id
            )
            payment_status = "STK Push Sent"
        except Exception as e:
            payment_status = f"M-Pesa Error: {str(e)}"

        return {
            "status": "success",
            "policy_id": policy.id,
            "partner_name": partner.name,
            "payment": payment_status
        }
    except Exception as e:
        print("\n❌ ❌ ❌ EMBEDDED POLICY ROUTE CRASHED ❌ ❌ ❌")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Check terminal for exact error")