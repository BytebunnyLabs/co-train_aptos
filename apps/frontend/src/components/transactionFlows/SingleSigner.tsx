import { isSendableNetwork, aptosClient } from "@/utils";
import { parseTypeTag, AccountAddress, U64 } from "@aptos-labs/ts-sdk";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-core";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button, Card, CardHeader, CardBody } from "@heroui/react";
import { toast } from "react-hot-toast";
import { TransactionHash } from "../TransactionHash";

const APTOS_COIN = "0x1::aptos_coin::AptosCoin";

/**
 * Generate a nonce with alphanumeric characters only.
 * This is a requirement for Sign in With Solana nonces
 */
function generateNonce() {
  return crypto.randomUUID().replaceAll("-", "");
}

export function SingleSigner() {
  const {
    connected,
    account,
    network,
    signAndSubmitTransaction,
    signMessageAndVerify,
    signMessage,
    signTransaction,
  } = useWallet();
  let sendable = isSendableNetwork(connected, network?.name);

  const onSignMessageAndVerify = async () => {
    const payload = {
      message: "Hello from Aptos Wallet Adapter",
      nonce: generateNonce(),
    };
    const response = await signMessageAndVerify(payload);
    toast.success(`Success: ${JSON.stringify({ onSignMessageAndVerify: response })}`);
  };

  const onSignMessage = async () => {
    const payload = {
      message: "Hello from Aptos Wallet Adapter",
      nonce: generateNonce(),
    };
    const response = await signMessage(payload);
    toast.success(`Success: ${JSON.stringify({ onSignMessage: response })}`);
  };

  const onSignAndSubmitTransaction = async () => {
    if (!account) return;
    const transaction: InputTransactionData = {
      data: {
        function: "0x1::coin::transfer",
        typeArguments: [APTOS_COIN],
        functionArguments: [account.address, 1], // 1 is in Octas
      },
    };
    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptosClient(network).waitForTransaction({
        transactionHash: response.hash,
      });
      toast.success("Transaction submitted successfully!");
    } catch (error) {
      console.error(error);
    }
  };

  const onSignAndSubmitScriptTransaction = async () => {
    if (!account) return;
    const transaction: InputTransactionData = {
      data: {
        bytecode:
          "0xa11ceb0b0700000a06010002030206050806070e2508334010731f010200030001000103060c050300083c53454c463e5f30046d61696e0d6170746f735f6163636f756e74087472616e73666572ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000114636f6d70696c6174696f6e5f6d65746164617461090003322e3003322e31000001050b000b010b02110002",
        typeArguments: [],
        functionArguments: [account.address, new U64(1)], // 1 is in Octas
      },
    };
    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptosClient(network).waitForTransaction({
        transactionHash: response.hash,
      });
      toast.success("Script transaction submitted successfully!");
    } catch (error) {
      console.error(error);
    }
  };

  const onSignAndSubmitBCSTransaction = async () => {
    if (!account) return;

    try {
      const response = await signAndSubmitTransaction({
        data: {
          function: "0x1::coin::transfer",
          typeArguments: [parseTypeTag(APTOS_COIN)],
          functionArguments: [AccountAddress.from(account.address), new U64(1)], // 1 is in Octas
        },
      });
      await aptosClient(network).waitForTransaction({
        transactionHash: response.hash,
      });
      toast.success("BCS transaction submitted successfully!");
    } catch (error) {
      console.error(error);
    }
  };

  // Legacy typescript sdk support
  const onSignTransaction = async () => {
    try {
      const payload: InputTransactionData = {
        data: {
          function: "0x1::coin::transfer",
          typeArguments: [APTOS_COIN],
          functionArguments: [account?.address.toString(), 1],
        },
      };
      const response = await signTransaction({
        transactionOrPayload: payload,
      });
      toast.success(`Success: ${JSON.stringify(response)}`);
    } catch (error) {
      console.error(error);
    }
  };

  const onSignRawTransaction = async () => {
    if (!account) return;

    try {
      const transactionToSign = await aptosClient(
        network
      ).transaction.build.simple({
        sender: account.address,
        data: {
          function: "0x1::coin::transfer",
          typeArguments: [APTOS_COIN],
          functionArguments: [account.address.toString(), 1],
        },
      });
      const response = await signTransaction({
        transactionOrPayload: transactionToSign,
      });
      toast.success(`Success: ${JSON.stringify(response)}`);
    } catch (error) {
      console.error(error);
    }
  };

  const onAddAuthenticationFunction = async () => {
    if (!account) return;
    alert("This method tests the wallet displays a warning message.");
    const transaction: InputTransactionData = {
      data: {
        function: "0x1::account_abstraction::add_authentication_function",
        functionArguments: [account.address, "dummyModule", "dummyFunction"],
      },
    };
    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptosClient(network).waitForTransaction({
        transactionHash: response.hash,
      });
      toast.success("Authentication function added successfully!");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Single Signer Flow</h3>
        </CardHeader>
        <CardBody className="flex flex-wrap gap-4">
          <Button onPress={onSignAndSubmitTransaction} isDisabled={!sendable}>
            Sign and submit transaction
          </Button>
          <Button
            onPress={onSignAndSubmitScriptTransaction}
            isDisabled={!sendable}
          >
            Sign and submit script transaction
          </Button>
          <Button onPress={onSignAndSubmitBCSTransaction} isDisabled={!sendable}>
            Sign and submit BCS transaction
          </Button>
          <Button onPress={onSignTransaction} isDisabled={!sendable}>
            Sign transaction
          </Button>
          <Button onPress={onSignRawTransaction} isDisabled={!sendable}>
            Sign raw transaction
          </Button>
          <Button onPress={onSignMessage} isDisabled={!sendable}>
            Sign message
          </Button>
          <Button onPress={onSignMessageAndVerify} isDisabled={!sendable}>
            Sign message and verify
          </Button>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Account Abstraction</h3>
        </CardHeader>
        <CardBody className="flex flex-wrap gap-4">
          <Button
            onPress={onAddAuthenticationFunction}
            isDisabled={!sendable}
            variant="bordered"
          >
            Add authentication function
          </Button>
        </CardBody>
      </Card>
    </>
  );
}
