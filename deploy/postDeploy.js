const utils = require("./utils");
const deploy = require("./deploy");
const config = require("./config.json");
const ethers = require("ethers");

const certificateTrustAnchorAddress = config.certificateTrustAnchorAddress;
const devTipbotAdminAddress = config.devTipbotAdminAddress
const prodTipbotAdminAddress = config.prodTipbotAdminAddress

// any addresses in this array will be added as contract admins
const admins = config.admins

let deployAccount = utils.ethersAccount(0)
let contracts = {}

let testAccount = utils.ethersAccount(8)
let firebaseWallet = new ethers.Wallet(utils.secrets.firebasePrivKey, utils.provider);
let kames = '0xfA67ddE98346d6033f3Da0b157b70fe8434a48cE'


const main = async () => {
    console.log("YOYOYOYOYOYOYO...")
    console.log(testAccount)

    console.log(utils.secrets)

    contracts.MeshToken = utils.getDeployedContract('MeshToken')
    contracts.MeshTokenFactory = utils.getDeployedContract('MeshTokenFactory')
    console.log(certificateTrustAnchorAddress)
    let x = await contracts.MeshTokenFactory.isRoleOwner(certificateTrustAnchorAddress, "create")
    console.log(x)

    let factoryAddress = contracts.MeshTokenFactory.address
    console.log(factoryAddress, "factory addr")


    let sig = await utils.createAnchorSignature('create',factoryAddress,'0xc78ba87a035126d40bff69d731b2e4390fd9f36f', firebaseWallet)
    console.log(sig)



    //await utils.callContract(contracts.MeshTokenFactory, testAccount, 'createNewToken', [ 'What the Flabbergasted', 'WTF', sig ])
}



main()