require('module-alias/register')

const utils = require("@utils");
const config = require("./config.json");
const ethers = require("ethers");

let collectiblesContract = utils.getDeployedContract('Collectibles');

// wallets
const collectionOwner = utils.ethersAccount(0)
const collectionDelegate = utils.ethersAccount(1)
const collectibleManager = utils.ethersAccount(2)
const redeemer = utils.ethersAccount(3)

let wasSuccessful = true;

const main = async () => {

  // create collection
  let params = ['dummyURI', [collectionDelegate.address]]
  let collectionID = await collectiblesContract.getCollectionID(collectionOwner.address, ...params)
  console.log(collectionID)

  let tx1 = await utils.callContract(collectiblesContract, collectionOwner, 'createCollection', params)

  await tx1.wait()
  let collMeta = await collectiblesContract.collection(collectionID)

  console.log(collMeta)

  // create collectibleType (as delegate)
  let uri = 'anotherDummyURI'
  let collectibleTypeID = await collectiblesContract.getCollectibleTypeID(collectionDelegate.address, collectionID, uri)

  let params2 = [collectionID, uri, [collectibleManager.address]]

  let tx2 = await utils.callContract(collectiblesContract, collectionDelegate, 'createCollectibleType', params2)
  await tx2.wait()

  let ctMeta = await collectiblesContract.collectibleType(collectibleTypeID)

  console.log(ctMeta)

  // mint a collectible
  // sign a cert for address and redeem it    

  let certHash = await collectiblesContract.createCollectibleTypeCertificateHash(collectibleTypeID, redeemer.address)
  let certificateSig = await signHash(certHash, collectibleManager)

  let params3 = [collectibleTypeID,certificateSig]

  let tx3 = await utils.callContract(collectiblesContract, redeemer, 'redeemCollectibleTypeCertificate', params3)
  await tx3.wait()


  let ctMeta2 = await collectiblesContract.collectibleType(collectibleTypeID)

  console.log(ctMeta2)

  await getLogs('CollectionCreated')
  await getLogs('CollectibleTypeMinted')
  

}

const getLogs = async (logName) => {
  const provider = utils.provider

  const filters = await collectiblesContract.filters[logName]()

  console.log(filters)
  const filter = {
    address: collectiblesContract.address,
    fromBlock: 0,
    toBlock: "latest",
    topics: filters.topics
  };
  const logs = await provider.getLogs(filter);
  console.log(logs)


  for (let log = 0; log < logs.length; log++) {
    let decoded = decodeLogs(logs[log], collectiblesContract.interface.events[logName]);
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
  //await utils.callContractParams(collectiblesContract, utils.ethersAccount(0), 'createCollection',['QmaKbu6eFUNwLthyKWAhPjgxuT3GZprj67H7rNYqASfrGJ', []], {gasLimit: 6000000})
  let etid = '0xf18d4011551d1c0be8ca5918ab9518ca5d3efb592ee0a1c3c03414b1fa285430'
  //await utils.callContractParams(collectiblesContract, utils.ethersAccount(0), 'createCertificateCollectibleType',[etid, 'QmXuEA2b91aSDzzn9MYeWvuygPSo3B2ZoHSuFBYjuWWDAi', [utils.ethersAccount(0).signingKey.address] ], {gasLimit: 6000000})
  let eid = '0x7d9e7d7ae4663aa28b5a47905da4514174384cbb7879cdfdbc223713d0be7657'
  let emblemCertHash = await collectiblesContract.createCollectibleTypeCertificateHash(eid, utils.ethersAccount(0).signingKey.address)

  let emblemCertificate = await signHash(emblemCertHash, utils.ethersAccount(0))

  await utils.callContractParams(collectiblesContract, utils.ethersAccount(0), 'redeemCollectibleTypeCertificate', [eid, emblemCertificate], { gasLimit: 6000000 })

  //createCertificateCollectibleType


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