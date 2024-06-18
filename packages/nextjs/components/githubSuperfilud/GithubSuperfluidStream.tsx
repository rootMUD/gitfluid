import { useEffect, useRef, useState } from "react";
import { GithubSuperfluidStreamCreate } from "./GithubSuperfluidStreamCreate";
import "github-markdown-css";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const GithubSuperfluidStream = ({
  repoAddress,
  flowRateRatioMap,
}: {
  repoAddress: string;
  flowRateRatioMap: Map<string, { receiverAddress: string; flowRateRatio: number }>;
}) => {
  const NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT = "0xAf921d3D5A903F8b658aeAEbeD7a30B3Dbb5B7Bc";
  const [totalFlowRate, setTotalFlowRate] = useState("");
  const [donateFlowRateInput, setDonateFlowRateInput] = useState("");
  const [donateFlowRate, setDonateFlowRate] = useState(0n);
  const modalRef = useRef<HTMLDialogElement>(null);
  const streamInfoModalRef = useRef<HTMLDialogElement>(null);
  const { address: senderAddress } = useAccount();
  const flowRateRatioRefs = useRef(new Map<string, any>());
  const {
    writeContractAsync: CreateFlowWriteAsync,
    isSuccess: isCreateFlowSuccess,
    isPending: isCreateFlowLoading,
  } = useScaffoldWriteContract("CFAv1Forwarder");
  const {
    writeContractAsync: removeStreamWriteAsync,
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

  const openStreamInfoModal = () => {
    streamInfoModalRef.current && streamInfoModalRef.current.showModal();
  };

  return (
    <div className="mt-5 space-y-5">
      {/* donate superfluid stream */}
      {senderAddress && senderAddress !== repoAddress && (
        <>
          <p className="m-0">
            <span className="text-blue-500">Current Donate Flow Rate:</span>
            {readLoading ? (
              <span className="flex justify-center items-center">
                <span className="loading loading-dots loading-md text-center"></span>
              </span>
            ) : (
              <span className="block text-center ">
                {!flowRateReadData && flowRateReadData !== 0n && "UNKNOW"}
                {flowRateReadData === 0n && "0 wei RMUDx/s"}
                {flowRateReadData && flowRateReadData > 0n && flowRateReadData.toString() + "wei RMUDx/s"}
              </span>
            )}
          </p>
          {flowRateReadData === 0n && (
            <p className="m-0">
              <span className="text-blue-500">Flow Rate Donate Calculated:</span>
              <span className="block text-center">{donateFlowRate.toString() + "wei RMUDx/s"}</span>
            </p>
          )}
          {/* <p className="m-0 flex">
            <span className="text-blue-500">TX Pendding Status:</span>
            {(isCreateFlowIdle || isRemoveFlowIdle) && (isRemoveFlowLoading || isCreateFlowLoading) && (
              <span className="loading loading-dots loading-md"></span>
            )}
            {(isCreateFlowIdle || isRemoveFlowIdle) && (isRemoveFlowSuccess || isCreateFlowSuccess) && <SuccessIcon />}
          </p> */}
          <div className="flex items-center justify-center">
            {flowRateReadData === 0n && (
              <>
                <label className="input dark:!bg-[#385183] input-bordered flex items-center gap-2 input-md mx-auto w-[16rem]">
                  <input
                    value={donateFlowRateInput}
                    onChange={e => setDonateFlowRateInput(e.target.value)}
                    type="text"
                    placeholder="Type Flow Rate"
                    className="dark:!bg-[#385183] grow w-[6rem]"
                  />
                  RMUDx/Day
                </label>
                <button
                  disabled={isCreateFlowLoading}
                  onClick={createDonateSuperfluidStream}
                  className="btn btn-success btn-outline ml-2"
                >
                  Donate
                </button>
              </>
            )}
            {flowRateReadData && flowRateReadData > 0n && (
              <button
                disabled={isRemoveFlowLoading}
                onClick={removeDonateSuperfluidStream}
                className="btn btn-success btn-outline ml-2"
              >
                reomve Donate
              </button>
            )}
          </div>
        </>
      )}
      {/* create stream */}
      {senderAddress && senderAddress !== repoAddress && (
        <>
          <label className="input dark:!bg-[#385183] input-bordered flex items-center gap-2 input-md mx-auto w-[18rem]">
            <input
              value={totalFlowRate}
              onChange={e => setTotalFlowRate(e.target.value)}
              type="text"
              placeholder="Type here total flow rate"
              className="dark:!bg-[#385183] grow"
            />
            RMUDx/Day
          </label>
          <button className="flex mx-auto btn btn-primary" onClick={openStreamInfoModal}>
            View Calculated Stream Flow Rate Info
          </button>
          <button onClick={openModalToSubmitTx} className="w-full flex mx-auto btn btn-accent">
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

      <dialog ref={streamInfoModalRef} className="modal">
        <div className="modal-box overflow-y-scroll">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-center text-lg">Stream Info</h3>
          <p className="m-0">total flow rate:</p>
          <p className="mt-0">
            {((isNaN(parseFloat(totalFlowRate)) ? 0n : parseEther(totalFlowRate)) / (24n * 60n * 60n)).toString() +
              "wei RMUDx/s"}
          </p>
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
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};
