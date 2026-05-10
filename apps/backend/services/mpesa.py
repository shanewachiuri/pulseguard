import os
import base64
import datetime
import httpx

class MpesaService:
    def __init__(self):
        self.consumer_key = os.getenv("DARAJA_CONSUMER_KEY")
        self.consumer_secret = os.getenv("DARAJA_CONSUMER_SECRET")
        self.passkey = os.getenv("DARAJA_PASSKEY")
        self.shortcode = os.getenv("DARAJA_SHORTCODE")
        self.base_url = "https://sandbox.safaricom.co.ke"

    async def get_access_token(self) -> str:
        credentials = f"{self.consumer_key}:{self.consumer_secret}"
        encoded_creds = base64.b64encode(credentials.encode()).decode()
        headers = {"Authorization": f"Basic {encoded_creds}"}

        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials", 
                headers=headers
            )
            return res.json().get("access_token")

    async def initiate_stk_push(self, phone: str, amount: int, account_reference: str):
        token = await self.get_access_token()
        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        password_str = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode()

        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone, # 2547XXXXXXXX format
            "PartyB": self.shortcode,
            "PhoneNumber": phone,
            "CallBackURL": "https://mydomain.com/mpesa/callback", # We will use ngrok later
            "AccountReference": account_reference,
            "TransactionDesc": "PulseGuard Premium"
        }

        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{self.base_url}/mpesa/stkpush/v1/processrequest", 
                headers=headers, json=payload
            )
            return res.json()

    async def b2c_payment(self, phone: str, amount: int, occasion: str):
        """
        Triggers a B2C (Business to Customer) payment from our shortcode to the user's M-Pesa wallet.
        """
        token = await self.get_access_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # Standard B2C Payload for Daraja Sandbox
        payload = {
            "InitiatorName": "testapi",
            "SecurityCredential": "dummy_sandbox_credential", # In production, this must be RSA-encrypted
            "CommandID": "BusinessPayment",
            "Amount": amount,
            "PartyA": self.shortcode,
            "PartyB": phone,
            "Remarks": occasion,
            "QueueTimeOutURL": "https://mydomain.com/mpesa/b2c/timeout",
            "ResultURL": "https://mydomain.com/mpesa/b2c/result",
            "Occasion": occasion
        }

        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{self.base_url}/mpesa/b2c/v1/paymentrequest", 
                headers=headers, json=payload
            )
            return res.json()