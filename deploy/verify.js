const utils = require("./utils");
const deploy = require("./deploy");
const config = require("./config.json");

const certificateTrustAnchorAddress = config.certificateTrustAnchorAddress;
const devTipbotAdminAddress = config.devTipbotAdminAddress
const prodTipbotAdminAddress = config.prodTipbotAdminAddress

// any addresses in this array will be added as contract admins
const admins = config.admins

let deployAccount = utils.ethersAccount(0)
let contracts = {}
let wasSuccessful = true;

const main = async () => {
    console.log("Deployment Verification Starting...")
    console.log('')
    contracts.MeshToken = utils.getDeployedContract('MeshToken')
    contracts.MeshTokenFactory = utils.getDeployedContract('MeshTokenFactory')
    contracts.MeshEscrowLite = utils.getDeployedContract('MeshEscrowLite')
    contracts.MeshEX = utils.getDeployedContract('MeshEX')
    contracts.Tipbot = utils.getDeployedContract('Tipbot')
    
    await verifyCreateAuth()
    await verifyAdminAuths()
    await verifyMintAuths()
    await verifyMeshTokenAddedToFactory()

    console.log('')
    console.log('')
    console.log("****************************************")
    console.log("Was Verification Successful? " + wasSuccessful)
    console.log("****************************************")
}


const verifyAdminAuths = async () => {
    for (let i = 0; i < admins.length; i++) {
        const addr = admins[i];

        let hasMTAdmin = await contracts.MeshToken.isRoleOwner(addr, 'admin')
        verifySuccess(hasMTAdmin, addr+' has mesh token admin auth')
        let hasFactoryAdmin = await contracts.MeshTokenFactory.isRoleOwner(addr, 'admin')
        verifySuccess(hasFactoryAdmin, addr+' has factory admin auth')
        let hasMeshEXAdmin = await contracts.MeshEX.isRoleOwner(addr, 'admin')
        verifySuccess(hasMeshEXAdmin, addr+' has meshex admin auth')
    }
}

const verifyMintAuths = async () => {
    let devTipHasMint = await contracts.MeshToken.isRoleOwner(devTipbotAdminAddress, 'mint')
    verifySuccess(devTipHasMint, 'dev tipbot address has mint auth')

    let prodTipHasMint = await contracts.MeshToken.isRoleOwner(prodTipbotAdminAddress, 'mint')
    verifySuccess(prodTipHasMint, 'prod tipbot address has mint auth')
}

const verifyCreateAuth = async () => {
    let createAuth = await contracts.MeshTokenFactory.isRoleOwner(certificateTrustAnchorAddress, 'create')
    verifySuccess(createAuth, 'firebase admin has create auth')
}


const verifyMeshTokenAddedToFactory = async () => {
    let tokenAddress = await contracts.MeshTokenFactory.getTokenInArray(0) //should be the first position in array
    let addressesMatch = tokenAddress == contracts.MeshToken.address
    verifySuccess(addressesMatch, 'Factory contract token = ' + tokenAddress + ' MeshToken = ' + contracts.MeshToken.address)
}


const verifySuccess = (isSuccess, text) => {
    console.log(text + ": " + isSuccess)
    if (wasSuccessful) {
        wasSuccessful = isSuccess
    }
}



main();