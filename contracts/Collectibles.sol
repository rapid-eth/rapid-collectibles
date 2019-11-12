pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol';
import 'openzeppelin-solidity/contracts/drafts/Counters.sol';

import "./libs/cryptography/ECDSA.sol";

contract Collectibles is ERC721Metadata {

    using ECDSA for bytes32;

    mapping (bytes32 => Collection) collections;
    mapping (bytes32 => CollectibleType) collectibleTypes;

    Counters.Counter private newTokenID;

    struct Collection {
        address owner;
        mapping (address => bool) delegates;
        string collectionURI;
    }

    struct CollectibleType {
        address creator;
        bytes32 collectionID;
        Counters.Counter count;
        string collectibleTypeURI;
        uint256 createLimit;

        mapping (address => bool) managers; //can mint these collectibleTypes AND sign certificates

        mapping (address => Counters.Counter) nonce;
    }

    constructor() ERC721Metadata("Collectibles", "CLCT") public {
    }

    function createCollection(string memory _collectionURI, address[] memory _delegates) public {
        bytes32 id = getCollectionID(msg.sender, _collectionURI, _delegates);
        Collection storage e = collections[id];
        e.owner = msg.sender;
        e.collectionURI = _collectionURI;
        e.delegates[msg.sender] = true;
        for (uint8 i = 0; i < _delegates.length; i++) {
            e.delegates[_delegates[i]] = true;
        }
        
        emit CollectionCreated(msg.sender, id);
    }

    function createCollectibleType(bytes32 _collectionID, string memory _collectibleTypeURI, address[] memory _managers) public returns (bool) {
        //only let collection owners create a new collectibleType
        require(collections[_collectionID].delegates[msg.sender], "not a delegate");
        bytes32 id = getCollectibleTypeID(msg.sender, _collectionID, _collectibleTypeURI);
        CollectibleType storage e = collectibleTypes[id];

        e.creator = msg.sender;
        e.collectionID = _collectionID;
        e.collectibleTypeURI = _collectibleTypeURI;

        for (uint8 i = 0; i < _managers.length; i++) {
            e.managers[_managers[i]] = true;
        }
        
        emit CollectibleTypeCreated(msg.sender, _collectionID, id);

        return true;
    }

    function mintCollectibleType(address to, bytes32 _collectibleTypeID) public
    {
        require(collectibleTypes[_collectibleTypeID].managers[msg.sender], "not manager");

        _mintCollectibleType(to,_collectibleTypeID);
    }

    function addCollectionDelegate(bytes32 _collectionID, address _delegate) public {
        require(collections[_collectionID].delegates[msg.sender], "not a delegate");
        collections[_collectionID].delegates[_delegate] = true;
    }

    function addCollectibleTypeManager(bytes32 _collectibleTypeID, address _m) public {
        require(collectibleTypes[_collectibleTypeID].creator == msg.sender, "not creator");
        collectibleTypes[_collectibleTypeID].managers[_m] = true;
    }

    function redeemCollectibleTypeCertificate(bytes32 _collectibleTypeID, bytes memory anchorSignature) public
    {
        require(isCertificateSigned(msg.sender, _collectibleTypeID, anchorSignature), "invalid cert signature");

        _mintCollectibleType(msg.sender, _collectibleTypeID);
    }

    function _mintCollectibleType(address _to, bytes32 _collectibleTypeID) internal
    {
        CollectibleType storage e = collectibleTypes[_collectibleTypeID];
        uint256 tokenId = newTokenID.current();
        newTokenID.increment();
        e.count.increment();
        e.nonce[_to].increment();

        _mint(_to, tokenId);
        _setTokenURI(tokenId, e.collectibleTypeURI);
        emit CollectibleTypeMinted(msg.sender, _to, _collectibleTypeID, tokenId);
    }

    function getCollectionID(address _owner, string memory _typeURI, address[] memory _delegates) public view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this),_owner,_typeURI, _delegates));
    }

    function getCollectibleTypeID(address _creator, bytes32 _typeID, string memory _collectibleTypeURI) public view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this),_creator,_typeID,_collectibleTypeURI));
    }

    function collection(bytes32 _collectionID) public view returns (address owner, string memory uri) {
        owner = collections[_collectionID].owner;
        uri = collections[_collectionID].collectionURI;
    }

    function isCollectionDelegate(bytes32 _collectionID, address _delegate) public view returns (bool) {
        return collections[_collectionID].delegates[_delegate];
    }

    function collectibleType(bytes32 _collectibleTypeID)
        public view returns (
            address creator,
            bytes32 collectionID,
            string memory uri,
            uint256 count)
    {
        creator = collectibleTypes[_collectibleTypeID].creator;
        collectionID = collectibleTypes[_collectibleTypeID].collectionID;
        uri = collectibleTypes[_collectibleTypeID].collectibleTypeURI;
        count = collectibleTypes[_collectibleTypeID].count.current();
    }

    function isCollectibleTypeManager(bytes32 _collectibleTypeID, address _minter) public view returns (bool) {
        return collectibleTypes[_collectibleTypeID].managers[_minter];
    }

    function getNextTokenID() public view returns (uint256) {
        return newTokenID.current();
    }

    function getCollectibleTypeNonce(bytes32 _collectibleTypeID, address _a) public view returns (uint256) {
        return collectibleTypes[_collectibleTypeID].nonce[_a].current();
    }

    function createCollectibleTypeMessageHash(bytes32 _collectibleTypeID) private view returns (bytes32) {
        return keccak256(abi.encodePacked(_collectibleTypeID,address(this),msg.sender));
    }

    function createCollectibleTypeCertificateHash(bytes32 _collectibleTypeID, address _to) public view returns (bytes32) {
        uint256 nonce = collectibleTypes[_collectibleTypeID].nonce[_to].current();
        return keccak256(abi.encodePacked(_collectibleTypeID,address(this), _to, nonce));
    }

    function isAnchorSigned(bytes32 _collectibleTypeID, bytes memory signature) private view returns (bool) {
        bytes32 msgHash = createCollectibleTypeMessageHash(_collectibleTypeID);
        return collectibleTypes[_collectibleTypeID].managers[msgHash.toEthSignedMessageHash().recover(signature)];
    }

    function isCertificateSigned(address _to, bytes32 _collectibleTypeID, bytes memory signature) private view returns (bool) {
        bytes32 msgHash = createCollectibleTypeCertificateHash(_collectibleTypeID, _to);
        return collectibleTypes[_collectibleTypeID].managers[msgHash.toEthSignedMessageHash().recover(signature)];
    }

    event CollectionCreated(address indexed _owner, bytes32 _collectionID);
    event CollectibleTypeCreated(address indexed _owner, bytes32 _collectionID, bytes32 _collectibleTypeID);
    event CollectibleTypeMinted(address indexed _minter, address indexed _to, bytes32 _collectibleTypeID, uint256 _tokenID);

}