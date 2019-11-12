require('module-alias/register')
const ethers = require("ethers");
const fs = require("fs");

let url = "http://127.0.0.1:7545";
let provider;//= new ethers.providers.JsonRpcProvider(url);
let networkID
//let provider = ethers.getDefaultProvider('rinkeby');

if (process.env.NETWORK === "rinkeby") {
  provider = ethers.getDefaultProvider('rinkeby');
  networkID = "4";
} else {
  provider = new ethers.providers.JsonRpcProvider(url);
  networkID = "5777";
}
//const Web3 = require('web3');
//const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545")); // mac os path

let secrets = require('@root/secrets.json')
let mnemonic = secrets.mnemonic;

// if (fs.existsSync("./secrets.json")) {
//   let secrets = JSON.parse(fs.readFileSync("./secrets.json", "utf8"));
//   mnemonic = secrets.mnemonic;
// } else {
//   console.log(
//     "No secrets.json found. If you are trying to publish EPM " +
//     "this will fail. Otherwise, you can ignore this message!"
//   );
//   mnemonic =
//     "";
// }

const ethersAccount = i => {
  let path = "m/44'/60'/0'/0/" + i;
  let w = ethers.Wallet.fromMnemonic(mnemonic, path);
  return new ethers.Wallet(w.signingKey.privateKey, provider);
};

const createStringMessageSignature = async (msg, wallet) => {
  let messageHash = ethers.utils.solidityKeccak256(["string"], [msg]);
  let messageHashBytes = ethers.utils.arrayify(messageHash);
  return await wallet.signMessage(messageHashBytes);
};

const createBytesMessageSignature = async (bytes, wallet) => {
  let messageHash = ethers.utils.solidityKeccak256(["bytes"], [bytes]);
  let messageHashBytes = ethers.utils.arrayify(messageHash);
  return await wallet.signMessage(messageHashBytes);
};

const callContract = async (contract, wallet, funcName, contractParams) => {
  try {
    let contractWithSigner = contract.connect(wallet);
    let response = await contractWithSigner.functions[funcName](
      ...contractParams, {gasLimit:6000000}
    );
    return response;
  } catch (err) {
    console.log("***ERROR CALLING CONTRACT***");
    console.log(err);
  }
};

const readContractFile = (name) => {
  let contract = require(`@contracts/${name}.json`)
  return contract
}
const readDeployedFile = (name) => {
  let contract = require(`@cdeployed/${name}.json`)
  return contract
}
const getDeployedContract = (name) => {
  let contract = require(`@deployed/${name}.json`)
  return getContract(contract.networks[networkID].address,contract.abi)
}

const callContractParams = async (contract, wallet, funcName, contractParams, txParams) => {
  try {
    let contractWithSigner = contract.connect(wallet);
    let response = await contractWithSigner.functions[funcName](
      ...contractParams, txParams
    );
    return response;
  } catch (err) {
    console.log("***ERROR CALLING CONTRACT***");
    console.log(err);
  }
};

const createAnchorSignature = async (permissionName, contractAddress, address, anchorWallet) => {
  let messageHash = ethers.utils.solidityKeccak256(["string", "address", "address"], [permissionName, contractAddress, address]);
  let messageHashBytes = ethers.utils.arrayify(messageHash);
  let sig = await anchorWallet.signMessage(messageHashBytes);
  return sig;
}

const createCertificateSignature = async (certID, contractAddress, address, anchorWallet) => {
  let messageHash = ethers.utils.solidityKeccak256(["bytes", "address", "address"], [certID, contractAddress, address]);
  let messageHashBytes = ethers.utils.arrayify(messageHash);
  let sig = await anchorWallet.signMessage(messageHashBytes);
  return sig;
}

const deployContract = async (abi, bytecode, wallet, params) => {
  try {

    let factory = new ethers.ContractFactory(abi, bytecode, wallet);

    let unsignedTx = factory.getDeployTransaction(...params)

    let gasEstimate = await provider.estimateGas(unsignedTx)
    console.log(gasEstimate.toString(), "gas eastim")

    let contract = await factory.deploy(...params);


    await contract.deployed()
    return contract

  } catch (err) {
    console.log("***ERROR deploying CONTRACT***");
    console.log(err);
  }
}

const getContract = (address, abi) => {
  return new ethers.Contract(address, abi, provider);
}

const readFile = (file) => {
  let content = fs.readFileSync(file, "utf8");
  console.log(content)
}

const writeToFile = (filename, obj) => {
  fs.writeFileSync(filename, JSON.stringify(obj, null, 4), "utf8");
}


const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
const getNonce = async (address) => {
  return await provider.getTransactionCount(address)
}

const bnToInt = (bn) => {
  return parseInt(bn.toString())
}

const emptyAddress = '0x0000000000000000000000000000000000000000'

const deployContractAndWriteToFile = async (contractName, deployerWallet, params) => {
  let contract = require(`@contracts/${contractName}.json`)

  //console.log(contract)

  let deployedContract = await deployContract(
    contract.abi,
    contract.bytecode,
    deployerWallet,
    params
  );

  await deployedContract.deployTransaction.wait()

  let networks = {}
  networks[networkID] = {
      address: deployedContract.address,
      transactionHash: deployedContract.deployTransaction.hash,
  }

  let truffleLike = {
      contractName,
      abi: contract.abi,
      bytecode: contract.bytecode,
      networks
  }
  writeToFile(`./build/deployed/${contractName}.json`, truffleLike)

  return deployedContract
}



module.exports = {
  ethersAccount,
  createStringMessageSignature,
  createBytesMessageSignature,
  callContract,
  readFile,
  sleep,
  provider,
  callContractParams,
  getNonce,
  readContractFile,
  deployContract,
  createAnchorSignature,
  createCertificateSignature,
  getContract,
  bnToInt,
  emptyAddress,
  writeToFile,
  deployContractAndWriteToFile,
  readDeployedFile,
  getDeployedContract,
  networkID,
  secrets
};
