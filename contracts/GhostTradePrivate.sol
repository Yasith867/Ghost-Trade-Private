// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * GhostTradePrivate — Privacy-preserving trading signal contract
 *
 * Deployment Target: Arbitrum Sepolia (testnet)
 *   RPC: https://sepolia-rollup.arbitrum.io/rpc
 *   Chain ID: 421614
 *
 * Deployment instructions:
 *   1. Install Foundry: curl -L https://foundry.paradigm.xyz | bash
 *   2. forge create --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
 *        --private-key $PRIVATE_KEY \
 *        contracts/GhostTradePrivate.sol:GhostTradePrivate
 *   3. Copy deployed address and update executionEngine.ts CONTRACT_ADDRESS
 *
 * For Fhenix Helium (real FHE):
 *   RPC: https://api.helium.fhenix.zone
 *   Chain ID: 8008135
 *   Replace euint32 types with Fhenix FHE library equivalents.
 */

contract GhostTradePrivate {
    address public owner;

    struct EncryptedSignal {
        bytes32 encryptedPayload;
        uint8 signalType;       // 0=HOLD, 1=BUY, 2=SELL
        uint8 confidence;       // 0–100
        uint256 timestamp;
        address requester;
        bool decryptedForView;
        bool publishedForTx;
    }

    uint256 public signalCount;
    mapping(uint256 => EncryptedSignal) public signals;
    mapping(address => bytes32) public permits;

    event SignalSubmitted(uint256 indexed signalId, address indexed requester, bytes32 encryptedPayload);
    event DecryptedForView(uint256 indexed signalId, address indexed requester, uint8 signalType, uint8 confidence);
    event DecryptedForTx(uint256 indexed signalId, address indexed requester, bytes32 txPayload);
    event PermitIssued(address indexed requester, bytes32 permitHash);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier hasPermit() {
        require(permits[msg.sender] != bytes32(0), "No permit");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * Submit an encrypted signal from the FHE pipeline.
     * In real Fhenix mode, encryptedPayload would be a real ciphertext.
     */
    function submitEncryptedSignal(
        bytes32 encryptedPayload,
        uint8 signalType,
        uint8 confidence
    ) external returns (uint256 signalId) {
        require(signalType <= 2, "Invalid signal type");
        require(confidence <= 100, "Invalid confidence");

        signalId = signalCount++;
        signals[signalId] = EncryptedSignal({
            encryptedPayload: encryptedPayload,
            signalType: signalType,
            confidence: confidence,
            timestamp: block.timestamp,
            requester: msg.sender,
            decryptedForView: false,
            publishedForTx: false
        });

        emit SignalSubmitted(signalId, msg.sender, encryptedPayload);
    }

    /**
     * Issue a view permit to the caller.
     * In real Fhenix FHE, this would involve cofhejs permit generation.
     */
    function requestPermit() external returns (bytes32 permitHash) {
        permitHash = keccak256(abi.encodePacked(msg.sender, block.timestamp, block.prevrandao));
        permits[msg.sender] = permitHash;
        emit PermitIssued(msg.sender, permitHash);
    }

    /**
     * decryptForView — reveals signal to the requester for UI display.
     * Requires a valid permit. In FHE mode, uses cofhejs to decrypt ciphertext.
     */
    function decryptForView(uint256 signalId) external hasPermit returns (uint8 signalType, uint8 confidence) {
        EncryptedSignal storage sig = signals[signalId];
        require(sig.requester == msg.sender || msg.sender == owner, "Not authorized");
        require(!sig.decryptedForView, "Already decrypted for view");

        sig.decryptedForView = true;
        signalType = sig.signalType;
        confidence = sig.confidence;

        emit DecryptedForView(signalId, msg.sender, signalType, confidence);
    }

    /**
     * decryptForTx — prepares an encrypted payload for on-chain execution.
     * Used by SoDEX / execution layer (Wave 2).
     */
    function decryptForTx(uint256 signalId) external hasPermit returns (bytes32 txPayload) {
        EncryptedSignal storage sig = signals[signalId];
        require(sig.requester == msg.sender || msg.sender == owner, "Not authorized");
        require(sig.decryptedForView, "Must decryptForView first");
        require(!sig.publishedForTx, "Already published for tx");

        sig.publishedForTx = true;

        txPayload = keccak256(abi.encodePacked(
            sig.encryptedPayload,
            sig.signalType,
            sig.confidence,
            msg.sender,
            block.timestamp
        ));

        emit DecryptedForTx(signalId, msg.sender, txPayload);
    }

    /**
     * publishDecryptResult — broadcasts the final decrypted result on-chain.
     * Marks the signal as publicly verifiable (for auditing / SoDEX settlement).
     */
    function publishDecryptResult(uint256 signalId) external onlyOwner {
        EncryptedSignal storage sig = signals[signalId];
        require(sig.publishedForTx, "Not yet prepared for tx");

        emit DecryptedForView(signalId, sig.requester, sig.signalType, sig.confidence);
    }

    function getSignal(uint256 signalId) external view returns (
        bytes32 encryptedPayload,
        uint8 signalType,
        uint8 confidence,
        uint256 timestamp,
        address requester,
        bool decryptedForView,
        bool publishedForTx
    ) {
        EncryptedSignal storage sig = signals[signalId];
        return (
            sig.encryptedPayload,
            sig.signalType,
            sig.confidence,
            sig.timestamp,
            sig.requester,
            sig.decryptedForView,
            sig.publishedForTx
        );
    }
}
