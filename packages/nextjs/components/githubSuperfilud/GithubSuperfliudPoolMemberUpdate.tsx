import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const GithubSuperfluidPoolMemberUnitUpdate = ({
  receiver,
  flowRateRatio,
  poolAddress,
}: {
  receiver: `0x${string}`;
  flowRateRatio: number;
  poolAddress: `0x${string}`;
}) => {
  const { writeContractAsync: updateMemberUnitsWriteAsync, isPending: isUpdateMemberUnitsPoolLoading } =
    useScaffoldWriteContract("GDAv1Forwarder");

  const updateMemberUnits = () => {
    updateMemberUnitsWriteAsync(
      {
        functionName: "updateMemberUnits",
        args: [poolAddress, receiver, BigInt(flowRateRatio * 100), "0x0"],
      },
      {
        onBlockConfirmation: txnReceipt => {
          console.log("📦 Transaction blockHash", txnReceipt.blockHash);
        },
      },
    );
  };
  return (
    <>
      <p className="m-0">
        <span className="text-blue-500">receiver:</span>
        {`${receiver}`}
      </p>
      <p className="m-0">
        <span className="text-blue-500">flow rate ratio:</span>
        {`${flowRateRatio}`}
      </p>
      <p className="m-0">
        <span className="text-blue-500">unit:</span>
        {`${flowRateRatio * 100}`}
      </p>
      <button
        className="mt-5 btn mx-auto w-full btn-sm"
        disabled={isUpdateMemberUnitsPoolLoading}
        onClick={updateMemberUnits}
      >
        Update Member Units
      </button>
    </>
  );
};
