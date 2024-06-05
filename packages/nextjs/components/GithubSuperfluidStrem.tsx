import { useRef, useState } from "react";
import { DistributionRulesJSON } from "./GithubShow";
import { GithubSuperfluidStreamCreate } from "./GithubSuperfluidStreamCreate";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

export const GithubSuperfluidStream = ({
  repoAddress,
  distributionRulesJSON,
}: {
  repoAddress: string;
  distributionRulesJSON: DistributionRulesJSON;
}) => {
  const [totalFlowRate, setTotalFlowRate] = useState("");
  const modalRef = useRef<HTMLDialogElement>(null);
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
  // const createSuperfluidStream = () => {
  //   flowRateRatioRefs.current.forEach((ref, receiverAddress) => {
  //     ref.createStream();
  //     console.log(`create stearm for ${receiverAddress}`);
  //   });
  // };

  const openModalToSubmitTx = () => {
    if (totalFlowRate) {
      if (totalFlowRate && !isNaN(parseFloat(totalFlowRate))) {
        modalRef.current && modalRef.current.showModal();
      } else {
        notification.error("Please set right type.");
      }
    } else {
      notification.error("Please set total flow rate.");
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
                <span className="text-blue-500">flow rate ratio:</span>
                {`${flowRateRatio}`}
              </p>
            </li>
          );
        })}
      </ul>

      <label className="input !bg-[#385183] input-bordered flex items-center gap-2 input-md mx-auto w-[18rem]">
        <input
          value={totalFlowRate}
          onChange={e => setTotalFlowRate(e.target.value)}
          type="text"
          placeholder="Type here total flow rate"
          className="!bg-[#385183] grow"
        />
        RMUDx/Day
      </label>
      <button
        onClick={openModalToSubmitTx}
        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Create Stream
      </button>
      <dialog ref={modalRef} className="modal">
        <div className="modal-box overflow-y-scroll">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-center text-lg">Create Stream</h3>
          <p className="m-0">total flow rate:</p>
          <p className="mt-0">
            {((isNaN(parseFloat(totalFlowRate)) ? 0n : parseEther(totalFlowRate)) / (24n * 60n * 60n)).toString() +
              "wei RMUDx/s"}
          </p>

          <ul className="break-all list-none space-y-5">
            {[...flowRateRatioMap.values()].map(({ flowRateRatio, receiverAddress }, index) => {
              return (
                <li className="bg-base-300 p-5 rounded-box" key={index}>
                  <p className="m-0">
                    <span className="text-blue-500">{`receiver${index + 1}:`}</span>
                    {`${receiverAddress}`}
                  </p>
                  <p className="m-0">
                    <span className="text-blue-500">flow rate ratio:</span>
                    {`${flowRateRatio}`}
                  </p>

                  <GithubSuperfluidStreamCreate
                    ref={ref => {
                      flowRateRatioRefs.current.set(receiverAddress, ref);
                    }}
                    receiver={receiverAddress}
                    totalFlowRate={totalFlowRate}
                    flowRateRatio={flowRateRatio}
                  />
                </li>
              );
            })}
          </ul>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
};
