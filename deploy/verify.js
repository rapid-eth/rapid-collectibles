const utils = require("./utils");
const config = require("./config.json");
const ethers = require("ethers");

const certificateTrustAnchorAddress = config.certificateTrustAnchorAddress;
const admins = config.admins
let emblemsContract = utils.getDeployedContract('Emblems');

let joeKey = '0x068a1a9B6dA95E03b6a2716FdEEe0854117300a3'

let wasSuccessful = true;

const main = async () => {

  await doSomething()

    let isAdm = await emblemsContract.isRoleOwner(utils.ethersAccount(0).signingKey.address, "admin")
    console.log(isAdm)

    let id = await emblemsContract.getEmblemTypeID(joeKey, 'QmYwqEBH86hrsWuuKaqkP2vc5FvqHeEiHT8i7DKiTCnNMx', ['0xB184807fda419Aac6267D6223cEe40954063afA1'])

    console.log(id)

   // let data = await emblemsContract.emblemType(id)
    //console.log(data)

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


const doSomething = async () => {
  //await utils.callContractParams(emblemsContract, utils.ethersAccount(0), 'createEmblemType',['QmaKbu6eFUNwLthyKWAhPjgxuT3GZprj67H7rNYqASfrGJ', []], {gasLimit: 6000000})
  let etid = '0xf18d4011551d1c0be8ca5918ab9518ca5d3efb592ee0a1c3c03414b1fa285430'
  //await utils.callContractParams(emblemsContract, utils.ethersAccount(0), 'createCertificateEmblem',[etid, 'QmXuEA2b91aSDzzn9MYeWvuygPSo3B2ZoHSuFBYjuWWDAi', [utils.ethersAccount(0).signingKey.address] ], {gasLimit: 6000000})
  let eid = '0x7d9e7d7ae4663aa28b5a47905da4514174384cbb7879cdfdbc223713d0be7657'
  let emblemCertHash = await emblemsContract.createEmblemCertificateHash(eid, utils.ethersAccount(0).signingKey.address)
  
  let emblemCertificate = await signHash(emblemCertHash, utils.ethersAccount(0))

  await utils.callContractParams(emblemsContract, utils.ethersAccount(0), 'redeemEmblemCertificate',[eid, emblemCertificate ], {gasLimit: 6000000})

  //createCertificateEmblem

  let wallet = new ethers.Wallet(privateKey);

  
}

const signHash = async (hash, wallet) => {
  let messageHashBytes = ethers.utils.arrayify(hash);
  return await wallet.signMessage(messageHashBytes);
};

const verifySuccess = (isSuccess, text) => {
    console.log(text + ": " + isSuccess)
    if (wasSuccessful) {
        wasSuccessful = isSuccess
    }
}



main();