// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title PulseGuardMutualPool
 * @dev Transparent accounting ledger for community "Chama" mutual insurance pools.
 */
contract PulseGuardMutualPool {
    address public admin;

    struct Pool {
        string name;
        uint256 totalPremiums;
        uint256 totalPayouts;
        bool isActive;
    }

    // Maps a backend UUID to the Pool struct
    mapping(string => Pool) public pools;

    // Maps poolId => member's hashed phone number => their total contribution
    mapping(string => mapping(bytes32 => uint256)) public memberContributions;

    event PoolCreated(string poolId, string name);
    event PremiumAdded(string poolId, bytes32 memberPhoneHash, uint256 amount);
    event PayoutDeducted(string poolId, uint256 amount);

    modifier onlyAdmin() {
        _checkAdmin();
        _;
    }

    function _checkAdmin() internal view {
        require(
            msg.sender == admin,
            "Unauthorized: Only PulseGuard backend allowed"
        );
    }

    constructor() {
        admin = msg.sender;
    }

    function createPool(
        string calldata poolId,
        string calldata name
    ) external onlyAdmin {
        require(!pools[poolId].isActive, "Pool already exists");
        pools[poolId] = Pool({
            name: name,
            totalPremiums: 0,
            totalPayouts: 0,
            isActive: true
        });
        emit PoolCreated(poolId, name);
    }

    function recordPremium(
        string calldata poolId,
        bytes32 phoneHash,
        uint256 amount
    ) external onlyAdmin {
        require(pools[poolId].isActive, "Pool inactive");
        pools[poolId].totalPremiums += amount;
        memberContributions[poolId][phoneHash] += amount;
        emit PremiumAdded(poolId, phoneHash, amount);
    }

    function recordPayout(
        string calldata poolId,
        uint256 amount
    ) external onlyAdmin {
        require(pools[poolId].isActive, "Pool inactive");
        pools[poolId].totalPayouts += amount;
        emit PayoutDeducted(poolId, amount);
    }

    function calculateSurplus(
        string calldata poolId
    ) external view returns (uint256) {
        require(pools[poolId].isActive, "Pool inactive");
        if (pools[poolId].totalPremiums > pools[poolId].totalPayouts) {
            return pools[poolId].totalPremiums - pools[poolId].totalPayouts;
        }
        return 0;
    }
}
