# Flastbots Transactions Building and Execution Nodejs API

Flashbots protocol enables a crypto wallet to submit a sequence of ethereum transactions in one block, away from the prying eyes of frontrunning bots and miners, while being able to pay the gas fee for such transactions with another crypto wallet.

[![Build](https://img.shields.io/github/actions/workflow/status/feyi-tech/flashbots-builder/main.yml)](https://github.com/feyi-tech/flashbots-builder)
[![Version](https://img.shields.io/npm/v/flashbots-builder)](https://github.com/feyi-tech/flashbots-builder)
[![GitHub issues](https://img.shields.io/github/issues/feyi-tech/flashbots-builder)](https://github.com/feyi-tech/flashbots-builder/issues)
[![GitHub stars](https://img.shields.io/github/stars/feyi-tech/flashbots-builder)](https://github.com/feyi-tech/flashbots-builder/stargazers)
[![GitHub license](https://img.shields.io/github/license/feyi-tech/flashbots-builder)](https://github.com/feyi-tech/flashbots-builder)
[![Total Downloads](https://img.shields.io/npm/dm/flashbots-builder)](https://github.com/feyi-tech/flashbots-builder)

## Installation

```bash
npm install flashbots-builder
```

With yarn:

```bash
yarn add flashbots-builder
```

## Usage

```javascript
//Get the FlashBot class. Build a bot by instatiating with its constructor,
//or with its FlashBot.Builder() builder static method
const FlashBot = require ("flashbots-builder").default
const { 
    Base, //Transaction request builder base class
    TransferERC20, //ERC20 token transfer transaction request builder class
    Approval721, //ERC721 token approve transaction request builder class
    CryptoKitties, //CryptoKitties transaction request builder class
    urlToJsonRpcProvider, //A method that returns ethersjs, "new providers.JsonRpcBatchProvider(url)"
    urlToStaticJsonRpcProvider //A method that returns ethersjs, "new providers.JsonRpcBatchProvider(url)"
} = require("flashbots-builder")
```

### ES6

```typescript
import FlashBot, { 
    Base, //Transaction request builder base class
    TransferERC20, //ERC20 token transfer transaction request builder class
    Approval721, //ERC721 token approve transaction request builder class
    CryptoKitties, //CryptoKitties transaction request builder class
    urlToJsonRpcProvider, //A method that returns ethersjs, "new providers.JsonRpcBatchProvider(url)"
    urlToStaticJsonRpcProvider //A method that returns ethersjs, "new providers.JsonRpcBatchProvider(url)"
} from "flashbots-builder"
```

## Examples

### Transfer ERC20 token from a wallet with private key at X while paying for gas with the one with private key Y, using the ethereum goerli testnet

```javascript
const { BigNumber } = require("ethers")
const FlashBot = require ("flashbots-builder").default
const { 
    TransferERC20,
    urlToStaticJsonRpcProvider
} = require("flashbots-builder")

const GWEI = BigNumber.from(10).pow(9)
const PRIORITY_GAS_PRICE = GWEI.mul(31)

FlashBot.Builder()
.addExecutorPrivateKey(X)//The private key of the wallet execute transation(s)
.addSponsorPrivateKey(Y)//The private key of the wallet that pays for the transactio(s)
//Adding transaction(s) to block with number CurrentBlockNumber + 2. Optional. default is 2
.addIntervalToFutureBlock(2)
//The amount of ethers in qwei to add to the current gas price. Optional. default is GWEI.mul(31)
.addPriorityGasPrice(PRIORITY_GAS_PRICE)
.addBlockChainRpcProvider(
    urlToStaticJsonRpcProvider("https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161")
)
.addBundleProviderConnectionInfoOrUrl("https://relay-goerli.flashbots.net")
.addBundleProviderNetwork("goerli")
.addBlockchainNetworkId("5")
.build()
.then(async (flashBot) => {
    //access the sponsor and executor Wallet object
    const sponsor = flashBot.getSponsorWallet()
    const executor = flashBot.getExecutorWallet()

    console.log(`sponsor: ${sponsor.address} | executor: ${executor.address}`)
    
    //The address of the token to transfer
    const TOKEN_ADDRESS_TEST = "0x06e9fdcb45cb817ab102646ab742c1911359a751"
    //create an ERC20 transfer
    const engine = new TransferERC20(
        flashBot.getProvider(),// the rpc provider. Available from the FlashBot insatnce's getProvider method
        executor.address, // the wallet address of the token sender
        sponsor.address, // the wallet address of the token recipient
        TOKEN_ADDRESS_TEST, // the address of the token smart contract
        utils.parseEther("300000") // the amount to transfer with decimals included as a BigNumber
    );
    //get the transaction
    const sponsoredTransactions = await engine.getSponsoredTransactions()

    console.log("Engine Description:", await engine.description())
    console.log("Engine Transaction:\n", sponsoredTransactions)

    const customBuiltTransferRequest = {
        chainId: 5,//Not required. The one in this FlashBot instance will be used if not supplied
        to: TOKEN_ADDRESS_TEST,
        gasLimit: "50000",//Not required. Will be calculated if not supplied
        data: iface.encodeFunctionData("transfer", [
            sponsor.address,
            utils.parseEther("1000000"),
        ]),
        maxFeePerGas: utils.parseUnits("3", "gwei"),//Not required. Will be calculated if not supplied
        maxPriorityFeePerGas: utils.parseUnits("2", "gwei"),//Not required. Will be calculated if not supplied
    }

    const listOfTransferRequest = [ customBuiltTransferRequest, customBuiltTransferRequest, customBuiltTransferRequest]
    const authSignerPrivateKey = null
    //Adding the transactions and executing them as a bundle.
    //Note that you don't have to add a transaction to send the needed ether for the execution. 
    // The needed gas fees will be calculated from all your transactions, and a transaction to 
    // send the total gas fees needed from the sponsor wallet to the executor wallet will be prepended 
    // to all your transactions
    flashBot
    .addMultipleBundleTx(sponsoredTransactions)//add mulitiple transfer request to the transactions bundle
    .addBundleTx(customBuiltTransferRequest)//add a single transfer request to the transactions bundle
    .addMultipleBundleTx(listOfTransferRequest)//add more mulitiple transfer request to the transactions bundle
    .addBundleTx(customBuiltTransferRequest)//add another single transfer request to the transactions bundle
    .execute(authSignerPrivateKey)//If the authSigner is not passed, one will be generated and included in the promise's result
    .then((result) => {
        console.log("result:", result)
        console.log(`Congrats, included in ${result.blockNumber}`)
    })
    .catch(e => {
        console.log("error:", e.message)
    })
})
.catch(e => {
    console.log("error:", e.message)
})
```

#### Response

```javascript
{
    blockNumber: 8662137,//The block number of the block the transaction(s) was/were added to
    //Generated or passed authSignerPrivateKey. If wasn't passed, It's advised to save the returned one 
    // and reuse next time to build up reputaion on the flashbots network
    authSignerKey: "0x3770dc0a8e658b4f334bdca2c9c14a8aa329899ad338c33597366e4bbbde3080",
    //total number of failed targeted blocks before the successfull targeted block.
    totalInclusionFails: 5
}
```

## Credits

[Flashbots](https://www.flashbots.net/)
[Ethers.js](https://github.com/ethers-io/ethers.js)

## Donate

If you find this helpful, consider donating to one of these address:

### Ethereum, BNB(BSC), Polygon, any EVM blockchain coin and ERC20 token:

0x7C0E94E471E0408Da5c459A4Cad1c52A5B6CaD8E

### BTC

13tDuyKmA6iU24JY7iSEackRmXRjohQdLt
