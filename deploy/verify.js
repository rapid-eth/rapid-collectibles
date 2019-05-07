const utils = require("./utils");
const config = require("./config.json");

const certificateTrustAnchorAddress = config.certificateTrustAnchorAddress;
const admins = config.admins

let wasSuccessful = true;

const main = async () => {
  
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