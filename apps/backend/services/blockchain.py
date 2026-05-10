import os
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

class BlockchainService:
    def __init__(self):
        rpc_url = os.getenv("POLYGON_AMOY_RPC_URL", "https://rpc-amoy.polygon.technology")
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))

        # Inject the middleware for Polygon (POA networks)
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

        self.account = self.w3.eth.account.from_key(os.getenv("ORACLE_PRIVATE_KEY"))
        self.contract_address = os.getenv("CONTRACT_ADDRESS")

        # ABI for Phase 2 Parametric Contract
        self.abi = [
            {
                "inputs": [
                    {"internalType": "string", "name": "policyId", "type": "string"},
                    {"internalType": "string", "name": "reason", "type": "string"}
                ],
                "name": "triggerPayout",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
        self.contract = self.w3.eth.contract(address=self.contract_address, abi=self.abi)

    def trigger_payout(self, policy_id: str, reason: str) -> str:
        nonce = self.w3.eth.get_transaction_count(self.account.address)

        # Build the transaction
        tx = self.contract.functions.triggerPayout(policy_id, reason).build_transaction({
            'chainId': 80002, # Amoy Chain ID
            'gas': 2000000,
            'maxFeePerGas': self.w3.to_wei('30', 'gwei'),
            'maxPriorityFeePerGas': self.w3.to_wei('30', 'gwei'),
            'nonce': nonce,
        })

        # Sign and send
        signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)

        return self.w3.to_hex(tx_hash)

    def record_pool_premium(self, pool_id: str, phone: str, amount: int) -> str:
        pool_address = os.getenv("MUTUAL_POOL_CONTRACT")
        if not pool_address:
            return "No pool address configured"

        # Minimal ABI for the Mutual Pool interaction
        pool_abi = [{
            "name": "recordPremium", 
            "type": "function", 
            "stateMutability": "nonpayable", 
            "inputs": [
                {"name": "poolId", "type": "string"}, 
                {"name": "phoneHash", "type": "bytes32"}, 
                {"name": "amount", "type": "uint256"}
            ]
        }]
        pool_contract = self.w3.eth.contract(address=pool_address, abi=pool_abi)

        # Hash the phone number for KDPA privacy before sending to the public blockchain
        phone_hash = self.w3.keccak(text=phone)

        nonce = self.w3.eth.get_transaction_count(self.account.address)
        
        # Build the transaction
        tx = pool_contract.functions.recordPremium(pool_id, phone_hash, amount).build_transaction({
            'chainId': 80002,
            'gas': 2000000,
            'maxFeePerGas': self.w3.to_wei('30', 'gwei'),
            'maxPriorityFeePerGas': self.w3.to_wei('30', 'gwei'),
            'nonce': nonce,
        })

        # Sign and send
        signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.account.key)
        # FIXED: Consistent use of raw_transaction for Web3 v7
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)

        return self.w3.to_hex(tx_hash)