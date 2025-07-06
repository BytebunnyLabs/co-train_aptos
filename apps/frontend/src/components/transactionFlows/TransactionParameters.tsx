import { aptosClient, isSendableNetwork } from "@/utils";
import {
  InputTransactionData,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { Button, Card, CardHeader, CardBody } from "@heroui/react";
import { toast } from "react-hot-toast";

const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const MaxGasAMount = 10000;

export function TransactionParameters() {
  const { connected, account, network, signAndSubmitTransaction, wallet } =
    useWallet();
  let sendable = isSendableNetwork(connected, network?.name);

  const onSignAndSubmitTransaction = async () => {
    if (!account) return;
    const transaction: InputTransactionData = {
      data: {
        function: "0x1::coin::transfer",
        typeArguments: [APTOS_COIN],
        functionArguments: [account.address, 1], // 1 is in Octas
      },
      options: { maxGasAmount: MaxGasAMount },
    };
    try {
      const commitedTransaction = await signAndSubmitTransaction(transaction);
      const executedTransaction = await aptosClient(network).waitForTransaction(
        {
          transactionHash: commitedTransaction.hash,
        },
      );
      // Check maxGasAmount is respected by the current connected Wallet
      if ((executedTransaction as any).max_gas_amount == MaxGasAMount) {
        toast.success(`${wallet?.name ?? "Wallet"} transaction ${executedTransaction.hash} executed with a max gas amount of ${MaxGasAMount}`);
      } else {
        toast.error(`${wallet?.name ?? "Wallet"} transaction ${executedTransaction.hash} executed with a max gas amount of ${(executedTransaction as any).max_gas_amount}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Validate Transaction Parameters</h3>
      </CardHeader>
      <CardBody className="flex flex-wrap gap-4">
        <Button onPress={onSignAndSubmitTransaction} isDisabled={!sendable}>
          With MaxGasAmount
        </Button>
      </CardBody>
    </Card>
  );
}
