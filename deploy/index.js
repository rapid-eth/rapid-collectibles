require('module-alias/register')

const utils = require("@utils");
const config = require("./config.json");

const certificateTrustAnchorAddress = config.certificateTrustAnchorAddress;

// any addresses in this array will be added as contract admins
const admins = config.admins

let deployAccount = utils.ethersAccount(0)
let contracts = {}

const main = async () => {
    console.log("Deployment Starting...")

    contracts.Collectibles = await utils.deployContractAndWriteToFile('Collectibles', deployAccount, [])

    console.log("Deployment Complete!")
}



main()