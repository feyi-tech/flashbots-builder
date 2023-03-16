const { utils } = require("ethers")
const FlashBot = require ("./build").default
const { TransferERC20, urlToStaticJsonRpcProvider } = require ("./build")
require('dotenv').config()

const BLOCKCHAIN_RPC_PROVIDER_TEST = urlToStaticJsonRpcProvider(process.env.RPC_URL_ETH)
const FLASH_BOTS_RPC_URL_TEST = process.env.FLASHBOTS_URL_ETH
const FLASH_BOTS_RPC_NETWORK_TEST = process.env.FLASHBOTS_NETWORK_ETH
const FLASH_BOTS_RPC_NETWORK_ID_TEST =parseInt(process.env.CHAIN_ID_ETH)
const TOKEN_ADDRESS_TEST = "0xBA62BCfcAaFc6622853cca2BE6Ac7d845BC0f2Dc"

const authSignerPrivateKey = null//process.env.AUTH_SIGNER_PK
//Build a flasbot
FlashBot.Builder()
.addSponsorPrivateKey(process.env.SPONSOR_PK_ETH)
.addExecutorPrivateKey(process.env.EXECUTOR_PK_ETH)
.addBlockChainRpcProvider(BLOCKCHAIN_RPC_PROVIDER_TEST)
.addBundleProviderConnectionInfoOrUrl(FLASH_BOTS_RPC_URL_TEST)
.addBundleProviderNetwork(FLASH_BOTS_RPC_NETWORK_TEST)
.addBlockchainNetworkId(FLASH_BOTS_RPC_NETWORK_ID_TEST)
.build()
.then(async (flashBot) => {
    //access the sponsor and executor Wallet object
    const sponsor = flashBot.getSponsorWallet()
    const executor = flashBot.getExecutorWallet()

    console.log(`sponsor: ${sponsor.address} | executor: ${executor.address}`)
    
    //create an ERC20 transfer
    const engine = new TransferERC20(
        flashBot.getProvider(), 
        executor.address, 
        sponsor.address, 
        TOKEN_ADDRESS_TEST,
        utils.parseEther("100000")
    );
    //get the transaction
    const sponsoredTransactions = await engine.getSponsoredTransactions()

    console.log("Engine Description:", await engine.description())
    console.log("Engine Transaction:\n", sponsoredTransactions)
    
    flashBot
    .addMultipleBundleTx(sponsoredTransactions)
    .execute(authSignerPrivateKey)//If the authSigner is not passed, one will be generated and included in the promise's result
    .then((result) => {
        console.log("result:", result)
        console.log(`Congrats, included in ${result.blockNumber}`)
    })
    .catch(e => {
        console.log("error:", e.message, e)
    })
})
.catch(e => {
    console.log("error:", e.message)
})