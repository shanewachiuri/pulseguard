import httpx
import hmac
import hashlib
import json

async def dispatch_webhook(url: str, secret: str, event_type: str, data: dict):
    if not url:
        return

    payload = {
        "event": event_type,
        "data": data
    }

    # Convert payload to a compact JSON string to ensure consistent hashing
    payload_str = json.dumps(payload, separators=(',', ':'))

    headers = {"Content-Type": "application/json"}

    # Generate HMAC-SHA256 signature if the partner has a secret configured
    if secret:
        signature = hmac.new(
            secret.encode('utf-8'),
            payload_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # FIXED: Attach the signature to the specific header key
        headers["X-PulseGuard-Signature"] = signature

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, content=payload_str, headers=headers, timeout=5.0)
            print(f"📡 Webhook sent to {url}. Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Webhook failed for {url}: {str(e)}")