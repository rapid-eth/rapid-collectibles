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

    contracts.Emblems = await utils.deployContractAndWriteToFile('Emblems', deployAccount, [])

    await addAdmins();
    console.log("Deployment Complete!")
}

const addAdmins = async () => {
    console.log("admin auth hex:")
    let x = await contracts.Emblems.temp();
    console.log(x)

    for (let i = 0; i < admins.length; i++) {
        const adminAddr = admins[i];
        console.log('granting admin auths to address ' + adminAddr)

        await utils.callContract(contracts.Emblems, deployAccount, 'addAdmin', [adminAddr])
    }
}



main()