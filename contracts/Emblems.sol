pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol';
import 'openzeppelin-solidity/contracts/drafts/Counters.sol';

import './libs/access/TrustAnchorRoles.sol';


contract Emblems is ERC721Metadata, TrustAnchorRoles {

    //TODO JSON SPEC

    mapping (bytes32 => Guild) guilds;
    mapping (bytes32 => Emblem) emblems;

    Counters.Counter private newTokenID;

    enum EmblemTypes { Minter, Certificate, Open }

    struct Guild {
        address owner;
        mapping (address => bool) delegates;
        string guildURI;
    }

    struct Emblem {
        address creator;
        bytes32 guildID;
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

    function createGuild(string memory _guildURI, address[] memory _delegates) public {
        bytes32 id = getGuildID(msg.sender, _guildURI, _delegates);
        Guild storage e = guilds[id];
        e.owner = msg.sender;
        e.guildURI = _guildURI;
        e.delegates[msg.sender] = true;
        for (uint8 i = 0; i < _delegates.length; i++) {
            e.delegates[_delegates[i]] = true;
        }
        
        emit GuildCreated(msg.sender, id);
    }

    function createMinterEmblem(bytes32 _guildID, string memory _emblemURI, address[] memory _minters) public returns (bool) {
        //only let guild owners create a new emblem
        require(guilds[_guildID].delegates[msg.sender]);

        bytes32 id = getEmblemID(msg.sender, _guildID, _emblemURI);
        Emblem storage e = emblems[id];
        for (uint8 i = 0; i < _minters.length; i++) {
            e.minters[_minters[i]] = true;
        }
        return _createNewEmblem(_guildID, _emblemURI);
    }

    function createCertificateEmblem(bytes32 _guildID, string memory _emblemURI, address[] memory _trustAnchors) public returns (bool) {
        //only let guild owners create a new emblem
        require(guilds[_guildID].delegates[msg.sender]);

        bytes32 id = getEmblemID(msg.sender, _guildID, _emblemURI);
        Emblem storage e = emblems[id];
        for (uint8 i = 0; i < _trustAnchors.length; i++) {
            e.trustAnchors[_trustAnchors[i]] = true;
        }
        return _createNewEmblem(_guildID, _emblemURI);
    }

    function createOpenEmblem(bytes32 _guildID, string memory _emblemURI, uint256 _limit) public returns (bool) {
        require(guilds[_guildID].delegates[msg.sender]);

        bytes32 id = getEmblemID(msg.sender, _guildID, _emblemURI);
        Emblem storage e = emblems[id];
        e.createLimit = _limit;
        return _createNewEmblem(_guildID, _emblemURI);
    }

    function _createNewEmblem(bytes32 _guildID, string memory _emblemURI) 
    internal
    returns (bool)
    {
        //only let guild owners create a new emblem
        require(guilds[_guildID].delegates[msg.sender]);

        bytes32 id = getEmblemID(msg.sender, _guildID, _emblemURI);
        Emblem storage e = emblems[id];
        e.creator = msg.sender;
        e.guildID = _guildID;
        e.emblemURI = _emblemURI;

        emit EmblemTypeCreated(msg.sender, id);
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

    function getGuildID(address _owner, string memory _typeURI, address[] memory _delegates) public view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this),_owner,_typeURI, _delegates));
    }

    function getEmblemID(address _owner, bytes32 _typeID, string memory _emblemURI) public view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this),_owner,_typeID,_emblemURI));
    }

    function guild(bytes32 _guildID) public view returns (address owner, string memory uri) {
        owner = guilds[_guildID].owner;
        uri = guilds[_guildID].guildURI;
    }

    function emblem(bytes32 _emblemID) public view returns (address creator, bytes32 guildID, string memory uri, uint256 count) {
        creator = emblems[_emblemID].creator;
        guildID = emblems[_emblemID].guildID;
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
    event GuildCreated(address indexed _owner, bytes32 _guildID);
    event EmblemTypeCreated(address indexed _owner, bytes32 _emblemID);
}