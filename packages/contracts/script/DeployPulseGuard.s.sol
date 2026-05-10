// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {PulseGuardParametric} from "../src/PulseGuardParametric.sol";

contract DeployPulseGuard is Script {
    function run() external {
        // Foundry automatically reads the .env file to get your key safely
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting transactions to the live network
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract!
        PulseGuardParametric pulseGuard = new PulseGuardParametric();

        // Stop broadcasting
        vm.stopBroadcast();

        // Log the address so we can connect our Python backend to it later
        console.log("PulseGuardParametric deployed at:", address(pulseGuard));
    }
}