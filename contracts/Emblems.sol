pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol';
import 'openzeppelin-solidity/contracts/drafts/Counters.sol';

import './libs/access/TrustAnchorRoles.sol';


contract Emblems is ERC721Metadata, TrustAnchorRoles {

    mapping (bytes32 => EmblemType) emblemTypes;

    Counters.Counter private newTokenID;
    struct EmblemType {
        address owner;
        Counters.Counter count; //lolz
        address[] minters;
        string emblemURI;
    }

    constructor() ERC721Metadata("Emblem", "EMB") public {
        addRoleOwner(msg.sender,ADMIN_AUTH);
    }
    
    function createNewEmblemType(string memory _emblemURI, address[] memory _minters) 
    public //TODO permission
    returns (bool)
    {
        bytes32 id = getEmblemTypeID(msg.sender, _emblemURI, _minters);
        EmblemType storage e = emblemTypes[id];

        e.owner = msg.sender;
        e.minters = _minters;
        e.emblemURI = _emblemURI;

        return true;
    }

    function mintEmblem(address to, bytes32 _typeID) public returns (bool)
    {
        //check minter
        EmblemType storage e = emblemTypes[_typeID];
        uint256 tokenId = newTokenID.current();
        newTokenID.increment();
        e.count.increment();

        _mint(to, tokenId);
        _setTokenURI(tokenId, e.emblemURI);
        return true;
    }

    function getEmblemTypeID(address _owner, string memory _emblemURI, address[] memory _minters) public view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this),_owner,_emblemURI, _minters));
    }

    function emblemType(bytes32 _typeID) public view returns (address owner, uint256 count, string memory uri) {
        owner = emblemTypes[_typeID].owner;
        count = emblemTypes[_typeID].count.current();
        uri = emblemTypes[_typeID].emblemURI;
    }

    /// ROLES
    string public ADMIN_AUTH = "admin";
    string public TYPE_CREATE_AUTH = "type_creator";

    function addAdmin(address account) public onlyAdmin {
        addRoleOwner(account,ADMIN_AUTH);
    }

    function addTypeCreator(address account) public onlyAdmin {
        addRoleOwner(account,TYPE_CREATE_AUTH);
    }

    modifier onlyAdmin {
        bytes32 roleHash = keccak256(abi.encodePacked(ADMIN_AUTH));
        require(roleOwners[msg.sender].roles[roleHash]);
        _;
    }

    event EmblemTypeCreated(address indexed _owner, bytes32 _emblemID);
}