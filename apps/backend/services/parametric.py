import asyncio
from prisma import Prisma
from services.mpesa import MpesaService
from services.blockchain import BlockchainService
from agent.tools import fetch_kmd_weather_index

async def run_parametric_evaluation(db: Prisma, mpesa: MpesaService, blockchain: BlockchainService):
    print("\n🌍 [Parametric Engine] Waking up to evaluate climate oracles...")

    active_policies = await db.micropolicy.find_many(
        where={"isActive": True, "coverageType": "Parametric Climate"},
        include={"user": True}
    )

    if not active_policies:
        print("ℹ️ No active parametric policies found.")
        return

    for policy in active_policies:
        
        
        
        # --- REAL ORACLE (Uncomment this when you are done testing!) ---
        oracle_result = fetch_kmd_weather_index.invoke({"county": "Nyeri"})

        if "CRITICAL" in oracle_result:
            print(f"🚨 Drought threshold breached for user {policy.user.phone}!")

            await db.micropolicy.update(
                where={"id": policy.id},
                data={"isActive": False, "assessmentText": f"Payout triggered. Oracle: {oracle_result}"}
            )

            # 1. Immutable Ledger Write
            try:
                tx_hash = blockchain.trigger_payout(policy.id, oracle_result)
                print(f"🔗 Blockchain Ledger Updated! Tx Hash: {tx_hash}")
            except Exception as e:
                print(f"❌ Blockchain write failed: {e}")

            # 2. Fiat Payout Execution via Daraja B2C
            try:
                # Daraja requires the 2547XXXXXXXX format
                formatted_phone = policy.user.phone
                if formatted_phone.startswith("0"):
                    formatted_phone = "254" + formatted_phone[1:]

                # Using a 100x multiplier payout for MVP (e.g., 50 KSh premium = 5000 KSh payout)
                payout_amount = int(policy.premiumAmount * 100)

                payout_res = await mpesa.b2c_payment(
                    phone=formatted_phone, 
                    amount=payout_amount, 
                    occasion=f"PulseGuard Claim {policy.id}"
                )
                print(f"💸 M-Pesa B2C Payout Initiated: {payout_res}")
            except Exception as e:
                print(f"❌ M-Pesa B2C Request Failed: {e}")
        else:
            print(f"🌱 Weather normal for {policy.user.phone}. No payout required.")
    print("--------------------------------------------------\n")