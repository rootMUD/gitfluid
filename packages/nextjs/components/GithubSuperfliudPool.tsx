import { useEffect, useState } from "react";
import "github-markdown-css";
import { parseEther } from "viem";
import { useScaffoldEventHistory, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const GithubSuperfluidPool = ({
  repoAddress,
  flowRateRatioMap,
}: {
  repoAddress: string;
  flowRateRatioMap: Map<string, { receiverAddress: string; flowRateRatio: number }>;
}) => {
  const NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT = "0xAf921d3D5A903F8b658aeAEbeD7a30B3Dbb5B7Bc";
  const [distributeFlowRateInput, setDistributeFlowRateInput] = useState("");
  const [distributeFlowRate, setDistributeFlowRate] = useState(0n);
  const {
    writeContractAsync: CreatePoolWriteAsync,
    isSuccess: isCreatePoolSuccess,
    isPending: isCreatePoolLoading,
  } = useScaffoldWriteContract("GDAv1Forwarder");
  const {
    writeContractAsync: connectPoolWriteAsync,
    isSuccess: isConnectPoolSuccess,
    isPending: isConnectPoolLoading,
  } = useScaffoldWriteContract("GDAv1Forwarder");
  const {
    writeContractAsync: disconnectPoolWriteAsync,
    isSuccess: isDisconnectPoolSuccess,
    isPending: isDisconnectPoolLoading,
  } = useScaffoldWriteContract("GDAv1Forwarder");

  const {
    writeContractAsync: distributeWriteAsync,
    isSuccess: isDistributePoolSuccess,
    isPending: isDistributePoolLoading,
  } = useScaffoldWriteContract("GDAv1Forwarder");

  const {
    data: poolCreatedevents,
    isLoading: isLoadingPoolCreatedEvents,
    error: errorReadingPoolCreatedEvents,
  } = useScaffoldEventHistory({
    contractName: "GDAv1Forwarder",
    eventName: "PoolCreated",
    fromBlock: 0n,
    filters: { token: NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, admin: repoAddress },
  });

  const createPool = () => {};

  const connectPool = () => {};

  const disconnectPool = () => {};

  const distribute = () => {};

  useEffect(() => {
    if (distributeFlowRateInput && !isNaN(parseFloat(distributeFlowRateInput))) {
      const flowRateNumber = parseFloat(distributeFlowRateInput);
      const donateFlowRateWei = parseEther(flowRateNumber.toString());
      const flowRate = donateFlowRateWei / (24n * 60n * 60n);
      setDistributeFlowRate(flowRate);
      console.log(`flowRate for ${repoAddress}: ${flowRate}`);
    } else {
      setDistributeFlowRate(0n);
    }
  }, [distributeFlowRateInput]);

  return (
    <div className="mt-5 space-y-5">
      {isLoadingPoolCreatedEvents && <div>Loading...</div>}
      {errorReadingPoolCreatedEvents && <div>Error: {errorReadingPoolCreatedEvents}</div>}
      {poolCreatedevents && (
        <div>
          <h3>Pool Created</h3>
          <pre>{JSON.stringify(poolCreatedevents, null, 2)}</pre>
        </div>
      )}
      <div className="flex items-center justify-center">
        <label className="input !bg-[#385183] input-bordered flex items-center gap-2 input-md mx-auto w-[16rem]">
          <input
            value={distributeFlowRateInput}
            onChange={e => setDistributeFlowRateInput(e.target.value)}
            type="text"
            placeholder="Type Flow Rate"
            className="!bg-[#385183] grow w-[6rem]"
          />
          RMUDx/Day
        </label>
        <button disabled={isDistributePoolLoading} className="btn btn-success btn-outline ml-2">
          Distribute
        </button>
      </div>
      <button className="w-full flex mx-auto btn btn-primary">Connect Pool</button>
      <button className="w-full flex mx-auto btn btn-primary">Disconnect Pool</button>
      <button className="w-full flex mx-auto btn btn-accent">Create Pool</button>
    </div>
  );
};
