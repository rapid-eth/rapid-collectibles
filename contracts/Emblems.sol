pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol';
import 'openzeppelin-solidity/contracts/drafts/Counters.sol';

import './libs/access/TrustAnchorRoles.sol';
import "./libs/cryptography/ECDSA.sol";

contract Emblems is ERC721Metadata, TrustAnchorRoles {

    using ECDSA for bytes32;

    mapping (bytes32 => EmblemType) emblemTypes;
    mapping (bytes32 => Emblem) emblems;

    Counters.Counter private newTokenID;

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
        uint256 createLimit;

        mapping (address => bool) managers; //can mint these emblems AND sign certificates

        mapping (address => Counters.Counter) nonce;
    }

    constructor() ERC721Metadata("Emblem", "MBLM") public {
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

    function createEmblem(bytes32 _emblemTypeID, string memory _emblemURI, address[] memory _managers) public returns (bool) {
        //only let emblemType owners create a new emblem
        require(emblemTypes[_emblemTypeID].delegates[msg.sender], "not a delegate");
        bytes32 id = getEmblemID(msg.sender, _emblemTypeID, _emblemURI);
        Emblem storage e = emblems[id];

        e.creator = msg.sender;
        e.emblemTypeID = _emblemTypeID;
        e.emblemURI = _emblemURI;

        for (uint8 i = 0; i < _managers.length; i++) {
            e.managers[_managers[i]] = true;
        }
        
        emit EmblemCreated(msg.sender, _emblemTypeID, id);

        return true;
    }

    function mintEmblem(address to, bytes32 _emblemID) public
    {
        require(emblems[_emblemID].managers[msg.sender], "not manager");

        _mintEmblem(to,_emblemID);
    }

    function addEmblemTypeDelegate(bytes32 _emblemTypeID, address _delegate) public {
        require(emblemTypes[_emblemTypeID].delegates[msg.sender], "not a delegate");
        emblemTypes[_emblemTypeID].delegates[_delegate] = true;
    }

    function addEmblemManager(bytes32 _emblemID, address _m) public {
        require(emblems[_emblemID].creator == msg.sender, "not creator");
        emblems[_emblemID].managers[_m] = true;
    }

    function redeemEmblemCertificate(bytes32 _emblemID, bytes memory anchorSignature) public
    {
        require(isCertificateSigned(msg.sender, _emblemID, anchorSignature), "invalid cert signature");

        _mintEmblem(msg.sender, _emblemID);
    }

    function _mintEmblem(address _to, bytes32 _emblemID) internal
    {
        Emblem storage e = emblems[_emblemID];
        uint256 tokenId = newTokenID.current();
        newTokenID.increment();
        e.count.increment();
        e.nonce[_to].increment();

        _mint(_to, tokenId);
        _setTokenURI(tokenId, e.emblemURI);
        emit EmblemMinted(msg.sender, _to, _emblemID, tokenId);
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

    function isEmblemTypeDelegate(bytes32 _emblemTypeID, address _delegate) public view returns (bool) {
        return emblemTypes[_emblemTypeID].delegates[_delegate];
    }

    function emblem(bytes32 _emblemID)
        public view returns (
            address creator,
            bytes32 emblemTypeID,
            string memory uri,
            uint256 count)
    {
        creator = emblems[_emblemID].creator;
        emblemTypeID = emblems[_emblemID].emblemTypeID;
        uri = emblems[_emblemID].emblemURI;
        count = emblems[_emblemID].count.current();
    }

    function isEmblemManager(bytes32 _emblemID, address _minter) public view returns (bool) {
        return emblems[_emblemID].managers[_minter];
    }

    function getNextTokenID() public view returns (uint256) {
        return newTokenID.current();
    }

    function getEmblemNonce(bytes32 _emblemID, address _a) public view returns (uint256) {
        return emblems[_emblemID].nonce[_a].current();
    }

    /// ROLES
    string public ADMIN_AUTH = "admin";
    bytes32 public ADMIN_AUTH_ROLE_HASH = 0xf23ec0bb4210edd5cba85afd05127efcd2fc6a781bfed49188da1081670b22d8;

    function addAdmin(address account) public onlyAdmin {
        addRoleOwner(account,ADMIN_AUTH);
    }

    modifier onlyAdmin {
        //bytes32 roleHash = keccak256(abi.encodePacked(ADMIN_AUTH));
        require(roleOwners[msg.sender].roles[ADMIN_AUTH_ROLE_HASH], "not admin");
        _;
    }



    function createEmblemMessageHash(bytes32 _emblemID) private view returns (bytes32) {
        return keccak256(abi.encodePacked(_emblemID,address(this),msg.sender));
    }

    function createEmblemCertificateHash(bytes32 _emblemID, address _to) public view returns (bytes32) {
        uint256 nonce = emblems[_emblemID].nonce[_to].current();
        return keccak256(abi.encodePacked(_emblemID,address(this), _to, nonce));
    }

    function isAnchorSigned(bytes32 _emblemID, bytes memory signature) private view returns (bool) {
        bytes32 msgHash = createEmblemMessageHash(_emblemID);
        return emblems[_emblemID].managers[msgHash.toEthSignedMessageHash().recover(signature)];
    }

    function isCertificateSigned(address _to, bytes32 _emblemID, bytes memory signature) private view returns (bool) {
        bytes32 msgHash = createEmblemCertificateHash(_emblemID, _to);
        return emblems[_emblemID].managers[msgHash.toEthSignedMessageHash().recover(signature)];
    }

    event EmblemTypeCreated(address indexed _owner, bytes32 _emblemTypeID);
    event EmblemCreated(address indexed _owner, bytes32 _emblemTypeID, bytes32 _emblemID);
    event EmblemMinted(address indexed _minter, address indexed _to, bytes32 _emblemID, uint256 _tokenID);

}