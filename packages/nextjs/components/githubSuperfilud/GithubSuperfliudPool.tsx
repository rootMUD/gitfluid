import { useEffect, useRef, useState } from "react";
import { GithubSuperfluidPoolMemberUnitUpdate } from "./GithubSuperfliudPoolMemberUpdate";
import "github-markdown-css";
import { useTheme } from "next-themes";
import { parseEther } from "viem";
import { decodeFunctionResult } from "viem";
import { useAccount } from "wagmi";
import contractABI from "~~/contracts/externalContracts";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const GithubSuperfluidPool = ({
  repoAddress,
  flowRateRatioMap,
}: {
  repoAddress: string;
  flowRateRatioMap: Map<string, { receiverAddress: string; flowRateRatio: number }>;
}) => {
  const NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT = "0xAf921d3D5A903F8b658aeAEbeD7a30B3Dbb5B7Bc";
  const POOL_ADDRESS = "0x3185F89934AE3d894a60d0fBe49384eabFC18135";
  const { theme } = useTheme();
  const { address: senderAddress } = useAccount();
  const [distributeFlowRateInput, setDistributeFlowRateInput] = useState("");
  const [distributeFlowRate, setDistributeFlowRate] = useState(0n);
  const [distributeAmountInput, setDistributeAmountInput] = useState<string>("");
  const [distributeAmount, setDistributeAmount] = useState(0n);

  const { writeContractAsync: createPoolWriteAsync } = useScaffoldWriteContract("GDAv1Forwarder");
  const { writeContractAsync: connectPoolWriteAsync } = useScaffoldWriteContract("GDAv1Forwarder");
  const { writeContractAsync: disconnectPoolWriteAsync } = useScaffoldWriteContract("GDAv1Forwarder");

  const { writeContractAsync: distributeWriteAsync, isPending: isDistributePoolLoading } =
    useScaffoldWriteContract("GDAv1Forwarder");
  const { writeContractAsync: distributeAmountWriteAsync } = useScaffoldWriteContract("GDAv1Forwarder");
  const {
    refetch: isMemberConnectedRefetch,
    isFetching: isConnectReadLoading,
    data: isConnectReadData,
  } = useScaffoldReadContract({
    contractName: "GDAv1Forwarder",
    functionName: "isMemberConnected",
    args: [POOL_ADDRESS, senderAddress],
  });

  const modalRef = useRef<HTMLDialogElement>(null);

  const createPool = () => {
    if (!senderAddress || senderAddress !== repoAddress) {
      return notification.error(
        `Just the repo owner: ${repoAddress.slice(0, 4)}...${repoAddress.slice(
          repoAddress.length - 4,
          repoAddress.length,
        )} can create stream.`,
      );
    }
    createPoolWriteAsync(
      {
        functionName: "createPool",
        args: [
          NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT,
          repoAddress,
          {
            transferabilityForUnitsOwner: false,
            distributionFromAnyAddress: true,
          },
        ],
      },
      {
        onBlockConfirmation: txnReceipt => {
          console.log("📦 Transaction blockHash", txnReceipt.blockHash);
          const createdPoolAddressData = txnReceipt.logs.find(
            log => log.topics[0] === "0x9c5d829b9b23efc461f9aeef91979ec04bb903feb3bee4f26d22114abfc7335b",
          )?.data;
          if (createdPoolAddressData) {
            const createdPoolAddress = decodeFunctionResult({
              abi: contractABI[10].GDAv1Forwarder.abi,
              functionName: "createPool",
              data: createdPoolAddressData,
            });
            console.log(`Created pool address: ${createdPoolAddress}`);
          }
        },
      },
    );
  };

  const connectPool = () => {
    if (!senderAddress || ![...flowRateRatioMap.keys()].includes(senderAddress)) {
      return notification.error("This Account is not the pool member.");
    }

    connectPoolWriteAsync(
      {
        functionName: "connectPool",
        args: [senderAddress, "0x0"],
      },
      {
        onBlockConfirmation: txnReceipt => {
          console.log("📦 Transaction blockHash", txnReceipt.blockHash);
        },
      },
    );
  };

  const disconnectPool = () => {
    if (!senderAddress || ![...flowRateRatioMap.keys()].includes(senderAddress)) {
      return notification.error("This Account is not the pool member.");
    }
    disconnectPoolWriteAsync(
      {
        functionName: "disconnectPool",
        args: [POOL_ADDRESS, "0x0"],
      },
      {
        onBlockConfirmation: txnReceipt => {
          console.log("📦 Transaction blockHash", txnReceipt.blockHash);
        },
      },
    );
  };

  const distributeFlow = () => {
    if (distributeFlowRate > 0n) {
      distributeWriteAsync(
        {
          functionName: "distributeFlow",
          args: [NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, senderAddress, POOL_ADDRESS, distributeFlowRate, "0x0"],
        },
        {
          onBlockConfirmation: txnReceipt => {
            console.log("📦 Transaction blockHash", txnReceipt.blockHash);
          },
        },
      );
    } else {
      notification.error("Please set right donate flow rate.");
    }
  };
  const distributeAmountToPool = () => {
    if (distributeAmount > 0n) {
      distributeAmountWriteAsync(
        {
          functionName: "distribute",
          args: [NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, senderAddress, POOL_ADDRESS, distributeAmount, "0x0"],
        },
        {
          onBlockConfirmation: txnReceipt => {
            console.log("📦 Transaction blockHash", txnReceipt.blockHash);
          },
        },
      );
    } else {
      notification.error("Please set right donate amount.");
    }
  };

  const openUpdateMemberUnitsModel = () => {
    if (!senderAddress || senderAddress !== repoAddress) {
      return notification.error(
        `Just the repo owner: ${repoAddress.slice(0, 4)}...${repoAddress.slice(
          repoAddress.length - 4,
          repoAddress.length,
        )} can create stream.`,
      );
    }
    modalRef.current && modalRef.current.showModal();
  };

  useEffect(() => {
    if (distributeFlowRateInput && !isNaN(parseFloat(distributeFlowRateInput))) {
      const flowRateNumber = parseFloat(distributeFlowRateInput);
      const donateFlowRateWei = parseEther(flowRateNumber.toString());
      const flowRate = donateFlowRateWei / (24n * 60n * 60n);
      setDistributeFlowRate(flowRate);
      console.log(`donate flowRate for ${repoAddress}: ${flowRate}`);
    } else {
      setDistributeFlowRate(0n);
    }
  }, [distributeFlowRateInput]);

  useEffect(() => {
    if (distributeAmountInput && !isNaN(parseFloat(distributeAmountInput))) {
      const flowRateNumber = parseFloat(distributeAmountInput);
      const donateAmountWei = parseEther(flowRateNumber.toString());
      setDistributeAmount(donateAmountWei);
      console.log(`donate amount for ${repoAddress}: ${donateAmountWei}`);
    } else {
      setDistributeAmount(0n);
    }
  }, [distributeAmountInput]);

  useEffect(() => {
    if (senderAddress && [...flowRateRatioMap.keys()].includes(senderAddress)) {
      isMemberConnectedRefetch();
    }
  }, [senderAddress]);
  return (
    <>
      <div className="mt-5 space-y-5">
        {/* pool info */}
        <div>
          <h3 className="text-blue-500">Created Pool Address:</h3>
          <p className="break-all">{POOL_ADDRESS}</p>
        </div>
        {senderAddress && (
          <>
            {/* distribute */}
            <div className="badge badge-primary">Distribute Flow</div>
            <div className="flex items-center justify-center">
              <label className="input dark:!bg-[#385183] input-bordered flex items-center gap-2 input-md mx-auto w-[16rem]">
                <input
                  value={distributeFlowRateInput}
                  onChange={e => setDistributeFlowRateInput(e.target.value)}
                  type="text"
                  placeholder="Type Flow Rate"
                  className="dark:!bg-[#385183] grow w-[6rem]"
                />
                RMUDx/Day
              </label>
              <button
                disabled={isDistributePoolLoading}
                onClick={distributeFlow}
                className="btn btn-success btn-outline ml-2"
              >
                Distribute
              </button>
            </div>
            <div className="badge badge-primary">Distribute Amount</div>
            <div className="flex items-center justify-center">
              <label className="input dark:!bg-[#385183] input-bordered flex items-center gap-2 input-md mx-auto w-[16rem]">
                <input
                  value={distributeAmountInput}
                  onChange={e => setDistributeAmountInput(e.target.value)}
                  type="text"
                  placeholder="Type Amount"
                  className="dark:!bg-[#385183] grow w-[6rem]"
                />
                RMUDx
              </label>
              <button
                disabled={isDistributePoolLoading}
                onClick={distributeAmountToPool}
                className="btn btn-success btn-outline ml-2"
              >
                Distribute
              </button>
            </div>

            {/* connect/disconnect pool */}
            <div className="badge badge-primary">Connect/Disconnect Pool</div>

            {[...flowRateRatioMap.keys()].includes(senderAddress) ? (
              <div className="flex justify-start items-center">
                <span className="text-blue-500">Current account connected:</span>
                {isConnectReadLoading ? (
                  <span className="loading loading-dots loading-md text-center"></span>
                ) : isConnectReadData ? (
                  "true"
                ) : (
                  "false"
                )}
              </div>
            ) : (
              <p className="text-blue-500">You are not the pool member yet</p>
            )}
            {isConnectReadData ? (
              <>
                <button className="w-full flex mx-auto btn btn-primary" onClick={disconnectPool}>
                  Disconnect Pool
                </button>
              </>
            ) : (
              <>
                <button className="w-full flex mx-auto btn btn-primary" onClick={connectPool}>
                  Connect Pool
                </button>
              </>
            )}

            {/* create pool/set member unit */}
            <div className="badge badge-primary">Set Member Unit</div>
            <button className="w-full flex mx-auto btn btn-secondary" onClick={openUpdateMemberUnitsModel}>
              Update Member Units
            </button>
            <div className="badge badge-primary">Create Pool</div>
            <button className="w-full flex mx-auto btn btn-accent" onClick={createPool}>
              Create Pool
            </button>
          </>
        )}
      </div>
      <dialog ref={modalRef} className="modal">
        <div className="modal-box overflow-hidden py-[0.5rem] pr-[2rem]">
          <div
            className="overflow-y-auto max-h-[calc(100vh-6rem)]"
            style={theme === "dark" ? { scrollbarColor: "black #385183" } : { scrollbarColor: "#93BBFB white" }}
          >
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-center mt-3 text-lg">Update Member Units</h3>
            <ul className="break-all mb-5 list-none space-y-5">
              {[...flowRateRatioMap.values()].map(({ flowRateRatio, receiverAddress }, index) => {
                return (
                  <li className="bg-base-300 p-5 rounded-box" key={index}>
                    <GithubSuperfluidPoolMemberUnitUpdate
                      poolAddress={POOL_ADDRESS}
                      receiver={receiverAddress}
                      flowRateRatio={flowRateRatio}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
};
