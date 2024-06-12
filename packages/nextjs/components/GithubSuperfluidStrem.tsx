import { JSX, SVGProps, useEffect, useRef, useState } from "react";
import { DistributionRulesJSON } from "./GithubShow";
import { GithubSuperfluidStreamCreate, SuccessIcon } from "./GithubSuperfluidStreamCreate";
import { RainbowKitCustomConnectButton } from "./scaffold-eth";
import "github-markdown-css";
import ReactMarkdown from "react-markdown";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const GithubSuperfluidStream = ({
  repoAddress,
  distributionRulesJSON,
  distributionRulesMD,
}: {
  repoAddress: string;
  distributionRulesJSON: DistributionRulesJSON;
  distributionRulesMD: string;
}) => {
  const NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT = "0xAf921d3D5A903F8b658aeAEbeD7a30B3Dbb5B7Bc";
  const [totalFlowRate, setTotalFlowRate] = useState("");
  const [donateFlowRateInput, setDonateFlowRateInput] = useState("");
  const [donateFlowRate, setDonateFlowRate] = useState(0n);
  const modalRef = useRef<HTMLDialogElement>(null);
  const { address: senderAddress } = useAccount();
  const flowRateRatioRefs = useRef(new Map<string, any>());
  const {
    writeContractAsync: CreateFlowWriteAsync,
    isIdle: isCreateFlowIdle,
    isSuccess: isCreateFlowSuccess,
    isPending: isCreateFlowLoading,
  } = useScaffoldWriteContract("CFAv1Forwarder");
  const {
    writeContractAsync: removeStreamWriteAsync,
    isIdle: isRemoveFlowIdle,
    isSuccess: isRemoveFlowSuccess,
    isPending: isRemoveFlowLoading,
  } = useScaffoldWriteContract("CFAv1Forwarder");
  const {
    refetch,
    isFetching: readLoading,
    data: flowRateReadData,
  } = useScaffoldReadContract({
    contractName: "CFAv1Forwarder",
    functionName: "getFlowrate",
    args: [NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, senderAddress, repoAddress],
  });
  console.log(`flowRateReadData: ${flowRateReadData}`);
  useEffect(() => {
    refetch();
  }, [isCreateFlowSuccess, isRemoveFlowSuccess]);
  useEffect(() => {
    if (donateFlowRateInput && !isNaN(parseFloat(donateFlowRateInput))) {
      const flowRateNumber = parseFloat(donateFlowRateInput);
      const donateFlowRateWei = parseEther(flowRateNumber.toString());
      const flowRate = donateFlowRateWei / (24n * 60n * 60n);
      setDonateFlowRate(flowRate);
      console.log(`flowRate for ${repoAddress}: ${flowRate}`);
    } else {
      setDonateFlowRate(0n);
    }
  }, [donateFlowRateInput]);
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

  const createDonateSuperfluidStream = () => {
    if (senderAddress == repoAddress) {
      return notification.error(`you are the repo owner, can not donate stream.`);
    }

    if (donateFlowRate > 0n) {
      console.log(`create stearm from ${senderAddress} to ${repoAddress}`, `flowRate: ${donateFlowRate}`);
      CreateFlowWriteAsync(
        {
          functionName: "createFlow",
          args: [NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, senderAddress, repoAddress, donateFlowRate, "0x0"],
        },
        {
          onBlockConfirmation: txnReceipt => {
            refetch();
            console.log("📦 Transaction blockHash", txnReceipt.blockHash);
          },
        },
      );
    } else {
      notification.error("Please set right donate flow rate.");
    }
  };
  const removeDonateSuperfluidStream = () => {
    console.log(`remove stearm from ${senderAddress} to ${repoAddress}`);
    removeStreamWriteAsync(
      {
        functionName: "deleteFlow",
        args: [NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, senderAddress, repoAddress, "0x0"],
      },
      {
        onBlockConfirmation: txnReceipt => {
          refetch();
          console.log("📦 Transaction blockHash", txnReceipt.blockHash);
        },
      },
    );
  };

  const openModalToSubmitTx = () => {
    if (senderAddress !== repoAddress) {
      return notification.error(
        `Just the repo owner: ${repoAddress.slice(0, 4)}...${repoAddress.slice(
          repoAddress.length - 4,
          repoAddress.length,
        )} can create stream.`,
      );
    }
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
    <div className="space-y-5">
      <div className="flex items-center space-x-2">
        <EthereumIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <p className="m-0 text-sm text-gray-500 dark:text-gray-400 break-all">{repoAddress}</p>
      </div>
      <p className="m-0">
        <span className="text-blue-500">current donate flow rate:</span>
        {readLoading ? (
          <span className="flex justify-center items-center">
            <span className="loading loading-dots loading-md text-center"></span>
          </span>
        ) : (
          <span className="block text-center ">
            {flowRateReadData === 0n && "0 wei RMUDx/s"}
            {flowRateReadData && flowRateReadData > 0n ? flowRateReadData.toString() + "wei RMUDx/s" : "unknow"}
          </span>
        )}
      </p>

      {flowRateReadData === 0n && (
        <p className="m-0">
          <span className="text-blue-500">flowRate want to donate:</span>
          <span className="block text-center">{donateFlowRate.toString() + "wei RMUDx/s"}</span>
        </p>
      )}
      <p className="m-0 flex">
        <span className="text-blue-500">tx pedding status:</span>
        {(isCreateFlowIdle || isRemoveFlowIdle) && (isRemoveFlowLoading || isCreateFlowLoading) && (
          <span className="loading loading-dots loading-md"></span>
        )}
        {(isCreateFlowIdle || isRemoveFlowIdle) && (isRemoveFlowSuccess || isCreateFlowSuccess) && <SuccessIcon />}
      </p>
      <div className="flex items-center justify-center">
        {flowRateReadData === 0n && (
          <label className="input !bg-[#385183] input-bordered flex items-center gap-2 input-md mx-auto w-[16rem]">
            <input
              value={donateFlowRateInput}
              onChange={e => setDonateFlowRateInput(e.target.value)}
              type="text"
              placeholder="flow rate"
              className="!bg-[#385183] grow w-[6rem]"
            />
            RMUDx/Day
          </label>
        )}
        {flowRateReadData === 0n && (
          <button
            disabled={isCreateFlowLoading}
            onClick={createDonateSuperfluidStream}
            className="btn btn-success btn-outline ml-2"
          >
            Donate
          </button>
        )}
        {flowRateReadData && flowRateReadData > 0n ? (
          <button
            disabled={isRemoveFlowLoading}
            onClick={removeDonateSuperfluidStream}
            className="btn btn-success btn-outline ml-2"
          >
            reomve Donate
          </button>
        ) : (
          !senderAddress && <RainbowKitCustomConnectButton />
        )}
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-medium text-center">Distribution Rules</h4>
        <ReactMarkdown className="space-y-1 text-sm text-gray-500 markdown-body dark:text-gray-400">
          {distributionRulesMD}
        </ReactMarkdown>
      </div>
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

      {senderAddress && (
        <>
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
        </>
      )}
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
    </div>
  );
};

function EthereumIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 320 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M311.9 199.9l-143.9-84c-2.5-1.5-5.7-1.5-8.3 0l-144 84c-3 1.8-3.9 5.8-2.1 8.8s5.8 3.9 8.8 2.1l135.2-79.1 135.2 79.1c1.4.8 3 1.3 4.6 1.3 2.3 0 4.5-1 6.1-2.9 1.8-3 1-7-2-8.8zM16 227.6l136 79.5v158.7c0 2.7 1.4 5.2 3.8 6.5 1.3 .8 2.7 1.1 4.1 1.1 1.7 0 3.3-.5 4.7-1.4l127.9-75.2v-149.7l-136-79.5c-3-1.8-7-.7-8.8 2.2-1.8 3-.7 7 2.2 8.8l119.6 70V371.1l-111.9 65.7V297.2c0-2.7-1.4-5.2-3.8-6.5-2.4-1.3-5.4-1.1-7.6 .5l-119.6 70V236.3c-.1-2.6-1.5-5-3.9-6.4-2.4-1.4-5.4-1.4-7.9 .2z" />
    </svg>
  );
}
