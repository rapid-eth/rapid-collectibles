pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol';
import 'openzeppelin-solidity/contracts/drafts/Counters.sol';

import './libs/access/TrustAnchorRoles.sol';


contract Emblems is ERC721Metadata, TrustAnchorRoles {

    //TODO JSON SPEC

    mapping (bytes32 => EmblemType) emblemTypes;
    mapping (bytes32 => Emblem) emblems;

    Counters.Counter private newTokenID;

    enum EmblemTypes { Minter, Certificate, Open }

    struct EmblemType {
        address owner;
        mapping (address => bool) delegates;
        string emblemTypeURI;
    }

    struct Emblem {
        address creator;
        bytes32 emblemTypeID;
        Counters.Counter count;
        string emblemURI;
        EmblemTypes eType;
        mapping (address => bool) minters;
        mapping (address => bool) trustAnchors;
        uint256 createLimit;
    }

    constructor() ERC721Metadata("Emblem", "EMB") public {
        addRoleOwner(msg.sender,ADMIN_AUTH);
    }

    function createEmblemType(string memory _emblemTypeURI, address[] memory _delegates) public {
        bytes32 id = getEmblemTypeID(msg.sender, _emblemTypeURI, _delegates);
        EmblemType storage e = emblemTypes[id];
        e.owner = msg.sender;
        e.emblemTypeURI = _emblemTypeURI;
        e.delegates[msg.sender] = true;
        for (uint8 i = 0; i < _delegates.length; i++) {
            e.delegates[_delegates[i]] = true;
        }
        
        emit EmblemTypeCreated(msg.sender, id);
    }

    function createMinterEmblem(bytes32 _emblemTypeID, string memory _emblemURI, address[] memory _minters) public returns (bool) {
        //only let emblemType owners create a new emblem
        require(emblemTypes[_emblemTypeID].delegates[msg.sender]);

        bytes32 id = getEmblemID(msg.sender, _emblemTypeID, _emblemURI);
        Emblem storage e = emblems[id];
        for (uint8 i = 0; i < _minters.length; i++) {
            e.minters[_minters[i]] = true;
        }
        return _createNewEmblem(_emblemTypeID, _emblemURI);
    }

    function createCertificateEmblem(bytes32 _emblemTypeID, string memory _emblemURI, address[] memory _trustAnchors) public returns (bool) {
        //only let emblemType owners create a new emblem
        require(emblemTypes[_emblemTypeID].delegates[msg.sender]);

        bytes32 id = getEmblemID(msg.sender, _emblemTypeID, _emblemURI);
        Emblem storage e = emblems[id];
        for (uint8 i = 0; i < _trustAnchors.length; i++) {
            e.trustAnchors[_trustAnchors[i]] = true;
        }
        return _createNewEmblem(_emblemTypeID, _emblemURI);
    }

    function createOpenEmblem(bytes32 _emblemTypeID, string memory _emblemURI, uint256 _limit) public returns (bool) {
        require(emblemTypes[_emblemTypeID].delegates[msg.sender]);

        bytes32 id = getEmblemID(msg.sender, _emblemTypeID, _emblemURI);
        Emblem storage e = emblems[id];
        e.createLimit = _limit;
        return _createNewEmblem(_emblemTypeID, _emblemURI);
    }

    function _createNewEmblem(bytes32 _emblemTypeID, string memory _emblemURI) 
    internal
    returns (bool)
    {
        //only let emblemType owners create a new emblem
        require(emblemTypes[_emblemTypeID].delegates[msg.sender]);

        bytes32 id = getEmblemID(msg.sender, _emblemTypeID, _emblemURI);
        Emblem storage e = emblems[id];
        e.creator = msg.sender;
        e.emblemTypeID = _emblemTypeID;
        e.emblemURI = _emblemURI;

        emit EmblemCreated(msg.sender, id);
        return true;
    }

    function mintEmblem(address to, bytes32 _emblemID) public returns (bool)
    {
        Emblem storage e = emblems[_emblemID];

        if (e.eType == EmblemTypes.Open) {
            //todo enforce create limit
        }
        if (e.eType == EmblemTypes.Minter) {
            require(e.minters[msg.sender]);
        }
        return _mintEmblem(to,_emblemID);
    }


    function mintEmblem(address to, bytes32 _emblemID, bytes32 anchorSignature) public returns (bool)
    {
        //require check anchor signature then
        //TODO
        return _mintEmblem(to,_emblemID);
    }


    function _mintEmblem(address to, bytes32 _emblemID) internal returns (bool)
    {
        Emblem storage e = emblems[_emblemID];
        uint256 tokenId = newTokenID.current();
        newTokenID.increment();
        e.count.increment();

        _mint(to, tokenId);
        _setTokenURI(tokenId, e.emblemURI);
        return true;
    }

    function getEmblemTypeID(address _owner, string memory _typeURI, address[] memory _delegates) public view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this),_owner,_typeURI, _delegates));
    }

    function getEmblemID(address _owner, bytes32 _typeID, string memory _emblemURI) public view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this),_owner,_typeID,_emblemURI));
    }

    function emblemType(bytes32 _emblemTypeID) public view returns (address owner, string memory uri) {
        owner = emblemTypes[_emblemTypeID].owner;
        uri = emblemTypes[_emblemTypeID].emblemTypeURI;
    }

    function emblem(bytes32 _emblemID) public view returns (address creator, bytes32 emblemTypeID, string memory uri, uint256 count) {
        creator = emblems[_emblemID].creator;
        emblemTypeID = emblems[_emblemID].emblemTypeID;
        uri = emblems[_emblemID].emblemURI;
        count = emblems[_emblemID].count.current();
    }

    /// ROLES
    string public ADMIN_AUTH = "admin";

    function addAdmin(address account) public onlyAdmin {
        addRoleOwner(account,ADMIN_AUTH);
    }

    modifier onlyAdmin {
        bytes32 roleHash = keccak256(abi.encodePacked(ADMIN_AUTH));
        require(roleOwners[msg.sender].roles[roleHash]);
        _;
    }
    event EmblemTypeCreated(address indexed _owner, bytes32 _emblemTypeID);
    event EmblemCreated(address indexed _owner, bytes32 _emblemID);
}