const utils = require("./utils");

const meshToken = async () => {
    console.log('deploying mesh token...')
    let params = ['Mesh Token', 0, 'MESH', utils.emptyAddress]
    console.log(params)
    let meshTokenContract = await utils.deployContractAndWriteToFile('MeshToken', utils.ethersAccount(0), params)
    console.log("MeshToken deployed at address: " + meshTokenContract.address)
    return meshTokenContract
}

const meshTokenFactory = async () => {
    console.log('deploying token factory...')
    params = []
    let factoryContract = await utils.deployContractAndWriteToFile('MeshTokenFactory', utils.ethersAccount(0), params)
    console.log("MeshTokenFactory deployed at address: " + factoryContract.address)
    return factoryContract
}

const meshEscrow = async () => {
    console.log('deploying escrow contract...')
    params = []
    let escrowContract = await utils.deployContractAndWriteToFile('MeshEscrowLite', utils.ethersAccount(0), params)
    console.log("Escrow contract deployed at address: " + escrowContract.address)
    return escrowContract
}

const meshEx = async () => {
    console.log('deploying MeshEX contract...')
    params = []
    let meshEXContract = await utils.deployContractAndWriteToFile('MeshEX', utils.ethersAccount(0), params)
    console.log("MeshEX contract deployed at address: " + meshEXContract.address)
    return meshEXContract
}

const tipbot = async () => {
    console.log('deploying Tipbot contract...')
    params = []
    let tipbotContract = await utils.deployContractAndWriteToFile('Tipbot', utils.ethersAccount(0), params)
    console.log("Tipbot contract deployed at address: " + tipbotContract.address)
    return tipbotContract
}


module.exports = {
    meshToken,
    meshTokenFactory,
    meshEscrow,
    meshEx,
    tipbot,
}