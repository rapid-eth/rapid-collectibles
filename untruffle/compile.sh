#/bin/sh

ALLOWED_DIRS=`pwd`/node_modules/openzeppelin-solidity/contracts/token/ERC721

OUTPUT_DIR=untruffle/compiled
rm -r $OUTPUT_DIR
solc openzeppelin-solidity/=`pwd`/node_modules/openzeppelin-solidity/ -o $OUTPUT_DIR --allow-paths $ALLOWED_DIRS --bin --abi --optimize contracts/*.sol
