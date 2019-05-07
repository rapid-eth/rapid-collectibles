# Mesh Token Contract Deployment Steps

1. Run ~~`truffle compile`~~ `npm run compile` to build the latest contract JSON files to the `/build/contracts` directory

2. Run `npm run deploy` which will do the following:
    - deploy new copies of all contracts and put the JSON results in `build/deployed/`
    - grants all necessary authorities
    - creates initial claim certificate type and prints out the cert ID
    - add Mesh Token address to the Factory contract `tokenAddresses` array

3. Run `npm run deploy-verify` to validate successful contract deployment and initialization

4. Copy deployed JSON files (from `/build/deployed/` dir) to necessary projects
    - tipbot (dev/prod directories)
    - rapid-mesh/rapid-mesh-dev

5. Update hardcoded values in the rapid-mesh firebase functions
    - Mesh Token Address
    - Mesh Token Factory Address
    - Initial Claim Cert ID (printed in step 2)

6. Redeploy all necessary applications
    - tipbot
    - rapid-mesh
    - firebase functions
    
7. Wipe firebase DB to allow users to re-register