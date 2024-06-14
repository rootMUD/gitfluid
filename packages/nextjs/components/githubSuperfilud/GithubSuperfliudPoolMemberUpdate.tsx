import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const GithubSuperfluidPoolMemberUnitUpdate = ({
  receiver,
  flowRateRatio,
  poolAdderess,
}: {
  receiver: string;
  flowRateRatio: number;
  poolAdderess: string;
}) => {
  const {
    writeContractAsync: updateMemberUnitsWriteAsync,
    isSuccess: isUpdateMemberUnitsPoolSuccess,
    isPending: isUpdateMemberUnitsPoolLoading,
  } = useScaffoldWriteContract("GDAv1Forwarder");

  const updateMemberUnits = () => {
    updateMemberUnitsWriteAsync(
      {
        functionName: "updateMemberUnits",
        args: [poolAdderess, receiver, BigInt(flowRateRatio * 100), "0x0"],
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
      <button className="mt-5 btn mx-auto w-full btn-sm" onClick={updateMemberUnits}>
        Update Member Units
      </button>
    </>
  );
};
