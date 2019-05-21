const utils = require("./utils");
const config = require("./config.json");

const certificateTrustAnchorAddress = config.certificateTrustAnchorAddress;
const admins = config.admins
let emblemsContract = utils.getDeployedContract('Emblems');

let joeKey = '0x068a1a9B6dA95E03b6a2716FdEEe0854117300a3'

let wasSuccessful = true;

const main = async () => {

    let isAdm = await emblemsContract.isRoleOwner(utils.ethersAccount(0).signingKey.address, "admin")
    console.log(isAdm)

    let id = await emblemsContract.getEmblemTypeID(joeKey, 'QmYwqEBH86hrsWuuKaqkP2vc5FvqHeEiHT8i7DKiTCnNMx', ['0xB184807fda419Aac6267D6223cEe40954063afA1'])

    console.log(id)

    let data = await emblemsContract.emblemType(id)
    console.log(data)

    const provider = utils.provider

    const filters=  await emblemsContract.filters['EmblemTypeCreated']()

    console.log(filters)
    const filter = {
        address: emblemsContract.address,
        fromBlock: 3951979,
        toBlock: "latest",
        topics: filters.topics
      };
      const logs = await provider.getLogs(filter);
      console.log(logs)


      for (let log = 0; log < logs.length; log++) {
        let decoded = decodeLogs(logs[log], emblemsContract.interface.events['EmblemTypeCreated']);
        console.log(decoded)
      }
}

const decodeLogs = (log, contractEventsInterface) => {
    // Cleanup Logs
    let cleaned = {};
    let decoded = contractEventsInterface.decode(
      log.data,
      log.topics
    );
    contractEventsInterface.inputs.forEach((input, i) => {
      if (input.type === "uint256") { //todo
        let x = decoded[input.name];
        cleaned[input.name] = x.toString(); //todo
      } else {
        cleaned[input.name] = decoded[input.name];
      }
    });
    log.decoded = cleaned;
    return decoded
  }


const verifyAdminAuths = async () => {
    for (let i = 0; i < admins.length; i++) {
        const addr = admins[i];

    }
}


const verifySuccess = (isSuccess, text) => {
    console.log(text + ": " + isSuccess)
    if (wasSuccessful) {
        wasSuccessful = isSuccess
    }
}



main();