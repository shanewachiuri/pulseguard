// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {PulseGuardParametric} from "../src/PulseGuardParametric.sol";

contract PulseGuardParametricTest is Test {
    PulseGuardParametric public pulseGuard;

    // The address that deploys the contract becomes the Oracle Admin
    address oracleAdmin = address(this);
    address unauthorizedUser = address(0x1234);

    function setUp() public {
        // This runs before every single test
        pulseGuard = new PulseGuardParametric();
    }

    function testRegisterPolicy() public {
        // We hash the phone number to simulate KDPA privacy compliance
        bytes32 phoneHash = keccak256(abi.encodePacked("254712345678"));

        pulseGuard.registerPolicy(
            "policy-123",
            phoneHash,
            "Parametric Climate",
            50,
            5000
        );

        (
            bytes32 savedHash,
            string memory covType,
            uint256 premium,
            uint256 payout,
            bool isActive
        ) = pulseGuard.policies("policy-123");

        assertEq(savedHash, phoneHash);
        assertEq(covType, "Parametric Climate");
        assertEq(premium, 50);
        assertEq(payout, 5000);
        assertTrue(isActive);
    }

    function testTriggerPayout() public {
        bytes32 phoneHash = keccak256(abi.encodePacked("254712345678"));
        pulseGuard.registerPolicy(
            "policy-123",
            phoneHash,
            "Parametric Climate",
            50,
            5000
        );

        // Trigger the payout
        pulseGuard.triggerPayout("policy-123", "Rainfall below 50mm");

        (, , , , bool isActive) = pulseGuard.policies("policy-123");

        assertFalse(isActive);
    }

    // FIXED: Modernized Foundry Revert Test
    function test_RevertWhen_UnauthorizedRegister() public {
        // vm.prank changes the msg.sender for the next call
        vm.prank(unauthorizedUser);

        bytes32 phoneHash = keccak256(abi.encodePacked("254712345678"));

        // Tell Foundry we explicitly EXPECT the next line to revert with this exact message
        vm.expectRevert("Only the Pulse Engine Oracle can call this");

        pulseGuard.registerPolicy(
            "policy-124",
            phoneHash,
            "Parametric Climate",
            50,
            5000
        );
    }
}