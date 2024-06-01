import { ethers } from 'ethers';

// Connect to an Ethereum node
const provider = new ethers.providers.JsonRpcProvider('https://optimism.llamarpc.com');
console.log(provider);
// Connect to the CFAv1Forwarder contract
const contractAddress = '0xcfA132E353cB4E398080B9700609bb008eceB125';

const abi = '[{"inputs":[{"internalType":"contract ISuperfluid","name":"host","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"CFA_FWD_INVALID_FLOW_RATE","type":"error"},{"inputs":[{"internalType":"contract ISuperToken","name":"token","type":"address"},{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"int96","name":"flowrate","type":"int96"},{"internalType":"bytes","name":"userData","type":"bytes"}],"name":"createFlow","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract ISuperToken","name":"token","type":"address"},{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"bytes","name":"userData","type":"bytes"}],"name":"deleteFlow","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract ISuperToken","name":"token","type":"address"},{"internalType":"address","name":"account","type":"address"}],"name":"getAccountFlowInfo","outputs":[{"internalType":"uint256","name":"lastUpdated","type":"uint256"},{"internalType":"int96","name":"flowrate","type":"int96"},{"internalType":"uint256","name":"deposit","type":"uint256"},{"internalType":"uint256","name":"owedDeposit","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract ISuperToken","name":"token","type":"address"},{"internalType":"address","name":"account","type":"address"}],"name":"getAccountFlowrate","outputs":[{"internalType":"int96","name":"flowrate","type":"int96"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract ISuperToken","name":"token","type":"address"},{"internalType":"int96","name":"flowrate","type":"int96"}],"name":"getBufferAmountByFlowrate","outputs":[{"internalType":"uint256","name":"bufferAmount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract ISuperToken","name":"token","type":"address"},{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"receiver","type":"address"}],"name":"getFlowInfo","outputs":[{"internalType":"uint256","name":"lastUpdated","type":"uint256"},{"internalType":"int96","name":"flowrate","type":"int96"},{"internalType":"uint256","name":"deposit","type":"uint256"},{"internalType":"uint256","name":"owedDeposit","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract ISuperToken","name":"token","type":"address"},{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"flowOperator","type":"address"}],"name":"getFlowOperatorPermissions","outputs":[{"internalType":"uint8","name":"permissions","type":"uint8"},{"internalType":"int96","name":"flowrateAllowance","type":"int96"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract ISuperToken","name":"token","type":"address"},{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"receiver","type":"address"}],"name":"getFlowrate","outputs":[{"internalType":"int96","name":"flowrate","type":"int96"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract ISuperToken","name":"token","type":"address"},{"internalType":"address","name":"flowOperator","type":"address"}],"name":"grantPermissions","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract ISuperToken","name":"token","type":"address"},{"internalType":"address","name":"flowOperator","type":"address"}],"name":"revokePermissions","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract ISuperToken","name":"token","type":"address"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"int96","name":"flowrate","type":"int96"}],"name":"setFlowrate","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract ISuperToken","name":"token","type":"address"},{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"int96","name":"flowrate","type":"int96"}],"name":"setFlowrateFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract ISuperToken","name":"token","type":"address"},{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"int96","name":"flowrate","type":"int96"},{"internalType":"bytes","name":"userData","type":"bytes"}],"name":"updateFlow","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract ISuperToken","name":"token","type":"address"},{"internalType":"address","name":"flowOperator","type":"address"},{"internalType":"uint8","name":"permissions","type":"uint8"},{"internalType":"int96","name":"flowrateAllowance","type":"int96"}],"name":"updateFlowOperatorPermissions","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]';

// just a test acct.
const priv = "replace_ur_priv_key_here";

const wallet = new ethers.Wallet(priv, provider);

const cfaForwarder = new ethers.Contract(contractAddress, abi, provider, wallet);


async function setFlowrate(contract, token, receiver, flowrate) {
    const tx = await contract.setFlowrate(token, receiver, flowrate);
    await tx.wait();
}

// === 

const contractAddressToken = "0xaf921d3d5a903f8b658aeaebed7a30b3dbb5b7bc"; //fake DAIx contract address on Mumbai
const contractABI = [
"function transferFrom(address from, address to, uint value)",
"function balanceOf(address owner) view returns (uint balance)",
];

const userAddress = "0x73c7448760517E3E6e416b2c130E3c6dB2026A1d";
const contract = new ethers.Contract(
    contractAddressToken,
    contractABI,
    provider
  );
const balance = await contract.balanceOf(userAddress);
console.log(ethers.utils.formatEther(balance.toString()));

// ===

setFlowrate(cfaForwarder, contractAddressToken, receiver, flowrate)