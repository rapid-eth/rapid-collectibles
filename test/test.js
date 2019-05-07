const assert = require("assert");
const utils = require("./utils");

let global = {};
global.contracts = {};

const account0 = utils.ethersAccount(0);
const account1 = utils.ethersAccount(1);
const account2 = utils.ethersAccount(2);
const account3 = utils.ethersAccount(3);

describe("Deploy and Initialize New Emblems contract", async function () {

    it("should deploy a new Emblems contract", async function () {
        const emblem = utils.readContractFile("Emblems");

        global.contracts.Emblem = await utils.deployContract(
            emblem.abi,
            emblem.bytecode,
            account0,
            []
        );

        let isAdmin = await global.contracts.Emblem.isRoleOwner(account0.signingKey.address, "admin")
        assert.equal(isAdmin,true)
    });

});