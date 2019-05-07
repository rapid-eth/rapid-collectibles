# Deploying Emblem Contracts

To run a local deployment (ganache) of the emblem contract you must have a file named `secrets.json` in the root folder with the following:


    {
        "mnemonic": "brain surround have swap horror body response double fire dumb bring hazard",
    }

Obviously, switch out the example mnemonic above for your own...

    #To deploy to local ganache
    npm run dev-deploy

    #To Verify deployment worked
    npm run dev-deploy-verify

