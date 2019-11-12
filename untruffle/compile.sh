#/bin/sh

CONTRACTS_BUILD_DIR=build/contracts
ALLOWED_DIRS=`pwd`/node_modules/openzeppelin-solidity/contracts/token/ERC721

OUTPUT_DIR=untruffle/compiled
rm -r $OUTPUT_DIR
mkdir -p $OUTPUT_DIR

solc openzeppelin-solidity/=`pwd`/node_modules/openzeppelin-solidity/ -o $OUTPUT_DIR --allow-paths $ALLOWED_DIRS --bin --abi --optimize contracts/*.sol

mkdir -p $CONTRACTS_BUILD_DIR