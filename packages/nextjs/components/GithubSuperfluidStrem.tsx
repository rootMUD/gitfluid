import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { DistributionRulesJSON } from "./GithubShow";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

const GithubSuperfluidStreamCreate = forwardRef(
  ({ receiver, flowRate }: { receiver: string; flowRate: bigint }, ref: any) => {
    const { address: senderAddress } = useAccount();
    const [txStatus, setTxStatus] = useState("");
    const {
      refetch,
      isLoading: readLoading,
      data,
    } = useScaffoldContractRead({
      contractName: "CFAv1Forwarder",
      functionName: "getFlowrate",
      args: [process.env.NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, senderAddress, receiver],
    });
    const { writeAsync, isIdle, isSuccess, isError, isLoading } = useScaffoldContractWrite({
      contractName: "CFAv1Forwarder",
      functionName: "createFlow",
      args: [process.env.NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, "senderAddress", "receiver", 0n, undefined],
      value: parseEther("0"),
      onBlockConfirmation: txnReceipt => {
        console.log("📦 Transaction blockHash", txnReceipt.blockHash);
      },
    });
    useImperativeHandle(ref, () => ({
      createStream: () => {
        if (flowRate > 0n) {
          writeAsync({
            args: [process.env.NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, senderAddress, receiver, flowRate, undefined],
            value: parseEther("0"),
          });
        }
      },
    }));
    useEffect(() => {
      refetch();
    }, [isSuccess]);
    return (
      <>
        <p className="m-0">
          <span className="text-blue-500">flowRate:</span>
          {readLoading ? (
            <span className="loading loading-dots loading-md"></span>
          ) : (
            <span> {data === 0n ? "none" : data}</span>
          )}
        </p>
        <p className="m-0">
          <span className="text-blue-500">tx status:</span>
          {txStatus}
        </p>
      </>
    );
  },
);
GithubSuperfluidStreamCreate.displayName = "GithubSuperfluidStreamCreate";
export const GithubSuperfluidStream = ({
  repoAddress,
  distributionRulesJSON,
}: {
  repoAddress: string;
  distributionRulesJSON: DistributionRulesJSON;
}) => {
  const [totalFlowRate, setTotalFlowRate] = useState("");
  const { address: senderAddress } = useAccount();
  const flowRateRatioRefs = useRef(new Map<string, any>());
  console.log(`Creating superfluid stream for address: ${repoAddress}`);
  console.log(`Creating superfluid stream based on rules: ${JSON.stringify(distributionRulesJSON)}`);
  const flowRateRatioMap = new Map<string, { receiverAddress: string; flowRateRatio: number }>();
  distributionRulesJSON.contributors.forEach(contributor => {
    if (flowRateRatioMap.has(contributor.addr)) {
      const flowRate = flowRateRatioMap.get(contributor.addr);
      if (flowRate) {
        flowRate.flowRateRatio = flowRate.flowRateRatio + contributor.distribution_rate;
      }
    } else {
      flowRateRatioMap.set(contributor.addr, {
        receiverAddress: contributor.addr,
        flowRateRatio: contributor.distribution_rate,
      });
    }
  });
  distributionRulesJSON.relatedRepos.forEach(repo => {
    if (flowRateRatioMap.has(repo.addr)) {
      const flowRate = flowRateRatioMap.get(repo.addr);
      if (flowRate) {
        flowRate.flowRateRatio = flowRate.flowRateRatio + repo.distribution_rate;
      }
    } else {
      flowRateRatioMap.set(repo.addr, { receiverAddress: repo.addr, flowRateRatio: repo.distribution_rate });
    }
  });
  const createSuperfluidStream = () => {
    flowRateRatioRefs.current.forEach((ref, receiverAddress) => {
      ref.createStream();
      console.log(`create stearm for ${receiverAddress}`);
    });
  };
  const getFlowRateByReceiver = (receiver: string) => {
    const flowRateRatio = flowRateRatioMap.get(receiver)?.flowRateRatio || 0;
    if (flowRateRatio && totalFlowRate) {
      const flowRate = (parseFloat(totalFlowRate) * flowRateRatio) / 100;
      const totalFlowRateWei = parseEther(flowRate.toString());
      return totalFlowRateWei / (24n * 60n * 60n);
    } else {
      return 0n;
    }
  };

  return (
    <>
      <h1 className="text-center">Stream Info</h1>
      <p className="m-0 break-all">
        <span className="text-blue-500">sender:</span>
        {senderAddress}
      </p>
      <ul className="break-all list-none space-y-5">
        {[...flowRateRatioMap.values()].map(({ flowRateRatio, receiverAddress }, index) => {
          return (
            <li key={index}>
              <p className="m-0">
                <span className="text-blue-500">{`receiver${index + 1}:`}</span>
                {`${receiverAddress}`}
              </p>
              <p className="m-0">
                <span className="text-blue-500">flowRateRatio:</span>
                {`${flowRateRatio}`}
              </p>

              <GithubSuperfluidStreamCreate
                ref={ref => {
                  flowRateRatioRefs.current.set(receiverAddress, ref);
                }}
                receiver={receiverAddress}
                flowRate={getFlowRateByReceiver(receiverAddress)}
              />
            </li>
          );
        })}
      </ul>

      <label className="input !bg-[#385183] input-bordered flex items-center gap-2 input-md mx-auto w-[18rem]">
        <input
          value={totalFlowRate}
          onChange={e => setTotalFlowRate(e.target.value)}
          type="text"
          placeholder="Type here total flowRate"
          className="!bg-[#385183] grow"
        />
        RMUDx/Day
      </label>
      <button
        onClick={() => createSuperfluidStream()}
        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Create Stream
      </button>
    </>
  );
};
