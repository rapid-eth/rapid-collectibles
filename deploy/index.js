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

const main = async () => {
    console.log("Deployment Starting...")

    contracts.MeshToken = await deploy.meshToken()
    contracts.MeshTokenFactory = await deploy.meshTokenFactory()
    contracts.Escrow = await deploy.meshEscrow()
    contracts.MeshEX = await deploy.meshEx()
    contracts.Tipbot = await deploy.tipbot()

    await grantAdminAuth()
    await grantMintAuth()
    await grantCreateAuth()
    await createInitialClaimCert()
    await addMeshTokenToFactoryArray()

    console.log("Deployment Complete!")
}

const grantAdminAuth = async () => {
    await utils.callContract(contracts.MeshToken, deployAccount, 'addTrustAnchor', [ deployAccount.signingKey.address ])

    for (let i = 0; i < admins.length; i++) {
        const adminAddr = admins[i];
        console.log('granting admin auths to address ' + adminAddr)

        await utils.callContract(contracts.MeshToken, deployAccount, 'addAdmin', [ adminAddr ])
        await utils.callContract(contracts.MeshTokenFactory, deployAccount, 'addAdmin', [ adminAddr ])
        await utils.callContract(contracts.MeshEX, deployAccount, 'addAdmin', [ adminAddr ])

        await utils.callContract(contracts.MeshToken, deployAccount, 'addTrustAnchor', [ adminAddr ])
    }
}

const grantMintAuth = async () => {
    console.log('granting minter auths...')
    //Tipbot Admins
    await utils.callContract(contracts.MeshToken, deployAccount, 'addMinter', [ devTipbotAdminAddress ])
    await utils.callContract(contracts.MeshToken, deployAccount, 'addMinter', [ prodTipbotAdminAddress ])
    //MeshEX
    await utils.callContract(contracts.MeshToken, deployAccount, 'addMinter', [ contracts.MeshEX.address ])

}

const grantCreateAuth = async () => {
    console.log('granting create auth to firebase Admin...')
    await utils.callContract(contracts.MeshTokenFactory, deployAccount, 'addCreateAdmin', [ certificateTrustAnchorAddress ])
}

const createInitialClaimCert = async () => {
    console.log("Creating initial claim certificate...")
    let certAmount = 100
    let certTypeArgs = [certAmount, [certificateTrustAnchorAddress], "initialClaim"];
    await utils.callContract(contracts.MeshToken, deployAccount, 'createCertificateType', certTypeArgs)
    let certID = await contracts.MeshToken.getCertificateID(...certTypeArgs)
    console.log("Initial Claim Certifitcate ID: " + certID)
}

const addMeshTokenToFactoryArray = async () => {
    console.log('Adding Mesh Token address to Factory array...')
    await utils.callContract(contracts.MeshTokenFactory, deployAccount, 'addTokenToArray', [contracts.MeshToken.address])
}


main()