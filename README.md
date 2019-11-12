# rapid-collectibes

The Collectibles contract sits on top of the ERC721 (non-fungible token standard) base contract and allows any individual or team to create a **Collection** and delegate the ability to create **CollectibleTypes**.

## Nomenclature

 - **Collection** - an individual/group of delegates who can create CollectibleTypes that live under the same umbrella
 - **CollectibleType** - a category of ERC721 tokens with the same attributes
 - **Collectible** - synonymous with token, the base unit of ERC721 contracts

Try it (requires you to have [solc binary (^0.5.0)](https://github.com/ethereum/solidity/releases) installed):

    npm install
    npm run compile

## deployment

See the [deploy instructions](/deploy)
