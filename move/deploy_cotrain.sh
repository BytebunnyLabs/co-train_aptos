#!/bin/bash

# This is a sample deployment script for the CoTrain project on Aptos.
# Version 5: Using jq for robust JSON parsing.

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
PROFILE_NAME="${APTOS_PROFILE:-default}"

echo "-------------------------------------------------------------"
echo "Attempting to find account address for profile: '$PROFILE_NAME'"

# --- Get the deployer account address ---
# This line now uses 'jq' to correctly parse the JSON output.
# The '-r' flag removes the quotes from the final string.
DEPLOYER_ADDRESS=$(aptos config show-profiles --profile "$PROFILE_NAME" | jq -r ".Result.default.account")

# Check if DEPLOYER_ADDRESS was found
if [ -z "$DEPLOYER_ADDRESS" ] || [ "$DEPLOYER_ADDRESS" == "null" ]; then
    echo "Error: Could not find account address for profile '$PROFILE_NAME'."
    echo "Please ensure 'jq' is installed ('sudo apt-get install jq') and that 'aptos init' has been run."
    exit 1
fi

echo "Deployment will proceed using Deployer Account: $DEPLOYER_ADDRESS"
echo "-------------------------------------------------------------"


# --- 1. Compile the Move code ---
echo "Compiling Move modules..."
aptos move compile --named-addresses "cotrain=${DEPLOYER_ADDRESS}"


# --- 2. Publish the modules to the blockchain ---
echo "Publishing modules to the blockchain..."
aptos move publish --named-addresses "cotrain=${DEPLOYER_ADDRESS}" --profile "$PROFILE_NAME"


# --- 3. Initialize the main network contract ---
echo "Initializing the CoTrain network..."
aptos move run \
  --function-id "${DEPLOYER_ADDRESS}::cotrain_network::initialize" \

  --profile "$PROFILE_NAME"

echo "-------------------------------------------------------------"
echo "Deployment successful!"
echo "The CoTrain network is live and initialized at address: $DEPLOYER_ADDRESS"
echo "-------------------------------------------------------------"