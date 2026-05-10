// SPDX-License-Identifier: MIT
pragma solidity 0.8.28; // FIXED: Removed the caret (^) to lock the version

/**
 * @title PulseGuardParametric
 * @dev Acts as a transparent, immutable ledger for parametric insurance policies.
 */
contract PulseGuardParametric {
    // FIXED: Added immutable (Make sure you save the file!)
    address public immutable oracleAdmin;

    struct Policy {
        bytes32 phoneNumberHash; // KDPA Privacy: Keccak256 hash of the M-Pesa number
        string coverageType;
        uint256 premiumAmountKSh;
        uint256 payoutAmountKSh;
        bool isActive;
    }

    // Maps a backend UUID (policyId) to the blockchain Policy struct
    mapping(string => Policy) public policies;

    // Events that our FastAPI backend will listen to
    event PolicyRegistered(string indexed policyId, bytes32 indexed phoneHash, uint256 payoutAmountKSh);
    event ParametricTriggered(string indexed policyId, string reason, uint256 payoutAmountKSh);

    // Optimized modifier to save gas
    modifier onlyOracle() {
        _onlyOracle();
        _;
    }

    // Internal function called by the modifier
    function _onlyOracle() internal view {
        require(msg.sender == oracleAdmin, "Only the Pulse Engine Oracle can call this");
    }

    constructor() {
        // The Python backend's wallet address becomes the oracle admin
        oracleAdmin = msg.sender;
    }

    function registerPolicy(
        string calldata policyId,
        bytes32 phoneHash,
        string calldata coverageType,
        uint256 premiumKSh,
        uint256 payoutKSh
    ) external onlyOracle {
        require(!policies[policyId].isActive, "Policy already exists");

        policies[policyId] = Policy({
            phoneNumberHash: phoneHash,
            coverageType: coverageType,
            premiumAmountKSh: premiumKSh,
            payoutAmountKSh: payoutKSh,
            isActive: true
        });

        emit PolicyRegistered(policyId, phoneHash, payoutKSh);
    }

    function triggerPayout(string calldata policyId, string calldata reason) external onlyOracle {
        require(policies[policyId].isActive, "Policy is not active or already paid");

        // Mark as inactive to mathematically prevent duplicate payout triggers
        policies[policyId].isActive = false;

        // Emit the event. The Python backend intercepts this and triggers Daraja B2C
        emit ParametricTriggered(policyId, reason, policies[policyId].payoutAmountKSh);
    }
}