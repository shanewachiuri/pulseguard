// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

// Explicitly import Script and console
import {Script, console} from "forge-std/Script.sol";

// Explicitly import the exact contract name
import {PulseGuardMutualPool} from "../src/PulseGuardMutualPool.sol";

contract DeployMutualPool is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        PulseGuardMutualPool pool = new PulseGuardMutualPool();

        // Initialize a default pool for our Nairobi Boda-Boda riders
        pool.createPool("chama-nairobi-01", "Nairobi CBD Boda Sacco");

        vm.stopBroadcast();
        console.log("MutualPool deployed at:", address(pool));
    }
}
