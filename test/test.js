const assert = require("assert");
const utils = require("./utils");

let global = {};
global.contracts = {};

const account0 = utils.ethersAccount(0);
const account1 = utils.ethersAccount(1);
const account2 = utils.ethersAccount(2);
const account3 = utils.ethersAccount(3);
const account4 = utils.ethersAccount(4);

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

    it("should allow adding an admin", async function () {

        let isAdminBefore = await global.contracts.Emblem.isRoleOwner(account1.signingKey.address, "admin")
        assert.equal(isAdminBefore,false)

        await utils.callContract(global.contracts.Emblem, account0, 'addAdmin', [account1.signingKey.address])

        let isAdminAfter = await global.contracts.Emblem.isRoleOwner(account1.signingKey.address, "admin")
        assert.equal(isAdminAfter,true)
    });

    xit("should set up event logs", async function () {
        console.log("Setting logs for emblem contract address: " + global.contracts.Emblem.address)
        global.contracts.Emblem.on("EmblemTypeCreated", (owner, id, event) => {
            console.log('**************Event Emitted**************')
            console.log("EVENT NAME: EmblemTypeCreated");
            console.log("OWNER: " + owner);
            console.log("EMBLEM Type ID: " + id);
            console.log('*****************************************')
        });

        global.contracts.Emblem.on("EmblemCreated", (owner, id, event) => {
            console.log('**************Event Emitted**************')
            console.log("EVENT NAME: EmblemCreated");
            console.log("Creator: " + owner);
            console.log("EMBLEM ID: " + id);
            console.log('*****************************************')
        });
        global.contracts.Emblem.on("EmblemMinted", (minter, eid, tid, event) => {
            console.log('**************Event Emitted**************')
            console.log("EVENT NAME: EmblemMinted");
            console.log("Minter: " + minter);
            console.log("EMBLEM ID: " + eid);
            console.log("Token ID: " + tid);
            console.log('*****************************************')
        });
    });

});

describe("Create New emblem type and emblem", async function () {

    const typeOwnerAccount = account2;
    const typeDelegateAccount = account1;
    const minterAccount = account3;
    const dummyTypeURI = 'dummyTypeURI';


    it("should allow user to create new emblem type", async function () {
        await utils.callContract(global.contracts.Emblem, typeOwnerAccount, 'createEmblemType',[dummyTypeURI, [typeDelegateAccount.signingKey.address]])
        let expectedID = await global.contracts.Emblem.getEmblemTypeID(typeOwnerAccount.signingKey.address, dummyTypeURI, [typeDelegateAccount.signingKey.address])

        // let isDelegate = await global.contracts.Emblem.isEmblemTypeDelegate(expectedID, typeDelegateAccount.signingKey.address);

        let emblemType = await global.contracts.Emblem.emblemType(expectedID)

        assert.equal(emblemType.uri, dummyTypeURI)
    });
    
    it("should allow delegate to create new minter emblem", async function () {
        const dummyEmblemURI = 'dummyMinterEmblemURI';

        let typeID = await global.contracts.Emblem.getEmblemTypeID(typeOwnerAccount.signingKey.address, dummyTypeURI, [typeDelegateAccount.signingKey.address])

        // let isDelegate = await global.contracts.Emblem.isEmblemTypeDelegate(typeID, typeDelegateAccount.signingKey.address);

        let minters =  [minterAccount.signingKey.address];
        await utils.callContractParams(global.contracts.Emblem, typeDelegateAccount, 'createMinterEmblem',[typeID, dummyEmblemURI, minters], {gasLimit: 6000000})

        let eID = await global.contracts.Emblem.getEmblemID(typeDelegateAccount.signingKey.address, typeID, dummyEmblemURI)

        let emblem = await global.contracts.Emblem.emblem(eID)

        assert.equal(emblem.uri, dummyEmblemURI)

        await utils.callContractParams(global.contracts.Emblem, minterAccount, 'mintEmblem',[minterAccount.signingKey.address, eID], {gasLimit: 6000000})
        await utils.callContractParams(global.contracts.Emblem, minterAccount, 'mintEmblem',[account0.signingKey.address, eID], {gasLimit: 6000000})
        await utils.callContractParams(global.contracts.Emblem, minterAccount, 'mintEmblem',[account1.signingKey.address, eID], {gasLimit: 6000000})

        let tokenURI = await  global.contracts.Emblem.tokenURI(2)
        let tokenOwner = await  global.contracts.Emblem.ownerOf(2)

        assert.equal(tokenURI,dummyEmblemURI)
        assert.equal(tokenOwner,account1.signingKey.address)

    });

    it("should allow delegate to create new certificate emblem", async function () {
        const dummyEmblemURI = 'dummyCertEmblemURI';
        const trustAnchor = account0

        let typeID = await global.contracts.Emblem.getEmblemTypeID(typeOwnerAccount.signingKey.address, dummyTypeURI, [typeDelegateAccount.signingKey.address])

        let anchors = [trustAnchor.signingKey.address]
        await utils.callContract(global.contracts.Emblem, typeDelegateAccount, 'createCertificateEmblem',[typeID, dummyEmblemURI, anchors])

        let eID = await global.contracts.Emblem.getEmblemID(typeDelegateAccount.signingKey.address, typeID, dummyEmblemURI)

        let emblem = await global.contracts.Emblem.emblem(eID)

        assert.equal(emblem.uri, dummyEmblemURI)

        //create cert for account4
        //let certSig = await utils.createCertificateSignature(eID, global.contracts.Emblem.address, account4.signingKey.address, trustAnchor)
        let emblemCerthash = await global.contracts.Emblem.createEmblemCertificateHash(eID, account4.signingKey.address)
        console.log("EMBLEM CERT HASH: " + emblemCerthash)
        let certSig = await utils.signHash(emblemCerthash, trustAnchor)

        console.log(certSig, "certSig")

        let nextTokenID = await global.contracts.Emblem.getNextTokenID()

        let ntIDInt = parseInt(nextTokenID.toString())
        console.log(ntIDInt, 'ntIDInt')

        //console.log(global.contracts.Emblem)

        await utils.callContractParams(global.contracts.Emblem, account4, 'redeemEmblemCertificate',[eID, certSig], {gasLimit: 6000000})

        
        let tokenURI = await  global.contracts.Emblem.tokenURI(ntIDInt)
        let tokenOwner = await  global.contracts.Emblem.ownerOf(ntIDInt)

        assert.equal(tokenURI,dummyEmblemURI)
        assert.equal(tokenOwner,account4.signingKey.address)

    });


});