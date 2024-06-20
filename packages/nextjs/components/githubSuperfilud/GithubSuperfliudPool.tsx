import { useEffect, useRef, useState } from "react";
import Image from "next/image";
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
  poolAddress,
}: {
  poolAddress: string;
  repoAddress: string;
  flowRateRatioMap: Map<string, { receiverAddress: string; flowRateRatio: number }>;
}) => {
  // TODO: make this dynamic from .env
  const NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT = "0xAf921d3D5A903F8b658aeAEbeD7a30B3Dbb5B7Bc";
  console.log("poolAddr", poolAddress);
  // DONE: updated the POOL_ADDRESS with get dynamically from the README.md
  const POOL_ADDRESS = poolAddress;
  /** moke pool for test */
  // const POOL_ADDRESS = "0xCF0Eaf51b5F7bA7cC2BF672dc05EBb6B4579d536";
  const { theme } = useTheme();
  const { address: senderAddress } = useAccount();
  const [distributeFlowRateInput, setDistributeFlowRateInput] = useState("");
  const [distributeFlowRate, setDistributeFlowRate] = useState(0n);
  const [distributeAmountInput, setDistributeAmountInput] = useState<string>("");
  const [distributeAmount, setDistributeAmount] = useState(0n);
  const {
    refetch: distributionFlowRateRefrech,
    isFetching: readDistributionFlowRateLoading,
    data: distributionFlowRateReadData,
  } = useScaffoldReadContract({
    contractName: "GDAv1Forwarder",
    functionName: "getFlowDistributionFlowRate",
    args: [NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, senderAddress, POOL_ADDRESS],
  });
  const { writeContractAsync: createPoolWriteAsync, isPending: isCreatePoolLoading } =
    useScaffoldWriteContract("GDAv1Forwarder");
  const { writeContractAsync: connectPoolWriteAsync, isPending: isConnectPoolLoading } =
    useScaffoldWriteContract("GDAv1Forwarder");
  const { writeContractAsync: disconnectPoolWriteAsync, isPending: isDisconnectPoolLoading } =
    useScaffoldWriteContract("GDAv1Forwarder");

  const { writeContractAsync: distributeWriteAsync, isPending: isDistributePoolLoading } =
    useScaffoldWriteContract("GDAv1Forwarder");
  const { writeContractAsync: distributeAmountWriteAsync, isPending: isDistributeAmountPoolLoading } =
    useScaffoldWriteContract("GDAv1Forwarder");
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
        )} can create pool.`,
      );
    }
    createPoolWriteAsync(
      {
        functionName: "createPool",
        args: [
          NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT,
          senderAddress,
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
        args: [POOL_ADDRESS, "0x0"],
      },
      {
        onBlockConfirmation: txnReceipt => {
          console.log("📦 Transaction blockHash", txnReceipt.blockHash);
          isMemberConnectedRefetch();
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
          isMemberConnectedRefetch();
        },
      },
    );
  };

  const distributeFlow = () => {
    if (distributeFlowRate >= 0n) {
      distributeWriteAsync(
        {
          functionName: "distributeFlow",
          args: [NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, senderAddress, POOL_ADDRESS, distributeFlowRate, "0x0"],
        },
        {
          onBlockConfirmation: txnReceipt => {
            console.log("📦 Transaction blockHash", txnReceipt.blockHash);
            distributionFlowRateRefrech();
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
        )} can set member unit.`,
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
          <h3 className="text-blue-500">Pool Address:</h3>
          <p className="text-center break-all">{POOL_ADDRESS}</p>
          <p className="m-0">
            <span className="text-blue-500">Current Flow Rate With Pool:</span>
            {readDistributionFlowRateLoading ? (
              <span className="flex justify-center items-center">
                <span className="loading loading-dots loading-md text-center"></span>
              </span>
            ) : (
              <span className="block text-center ">
                {!distributionFlowRateReadData && distributionFlowRateReadData !== 0n && "UNKNOW"}
                {distributionFlowRateReadData ||
                  (distributionFlowRateReadData == 0n && distributionFlowRateReadData.toString() + "wei RMUDx/s")}
              </span>
            )}
          </p>
        </div>
        {senderAddress && (
          <>
            {/* distribute flow*/}
            <hr></hr>
            <h2>
              <center>For Donator</center>
            </h2>
            <div className="space-y-2">
              <div className="badge badge-primary">Donate by Stream Way</div>

              <p className="m-0">
                <span className="text-blue-500">Flow Rate Distribute Typed Calculated:</span>
                <span className="block text-center">{distributeFlowRate.toString() + "wei RMUDx/s"}</span>
              </p>

              <div className="flex items-center justify-center">
                <label className="input dark:!bg-[#385183] input-bordered flex items-center gap-2 input-md mx-auto  w-full">
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
                  Donate
                </button>
              </div>
            </div>

            {/* distribute amount*/}
            <div className="space-y-2">
              <div className="badge badge-primary">Donate Directly</div>
              <Image
                src="/assets/superfluid_distribution_instance.gif"
                alt="Superfluid Distribution Instance"
                width={500} // Adjust the width as needed
                height={300} // Adjust the height as needed
                layout="responsive" // This makes the image scale nicely to the parent element
              />
              <p className="m-0">
                <span className="text-blue-500">Amount Distribute Typed Calculated:</span>
                <span className="block text-center">{distributeAmount.toString() + "wei RMUDx"}</span>
              </p>
              <div className="flex items-center justify-center">
                <label className="input dark:!bg-[#385183] input-bordered flex items-center gap-2 input-md mx-auto  w-full">
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
                  disabled={isDistributeAmountPoolLoading}
                  onClick={distributeAmountToPool}
                  className="btn btn-success btn-outline ml-2"
                >
                  Donate
                </button>
              </div>
            </div>
            <hr></hr>
            <h2>
              <center>For Receiver</center>
            </h2>
            <div className="space-y-2">
              <div className="badge badge-primary">Connect/Disconnect Pool to receive donation</div>

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
                  <button
                    className="w-full flex mx-auto btn btn-primary"
                    disabled={isDisconnectPoolLoading}
                    onClick={disconnectPool}
                  >
                    Disconnect Pool
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="w-full flex mx-auto btn btn-primary"
                    disabled={isConnectPoolLoading}
                    onClick={connectPool}
                  >
                    Connect Pool
                  </button>
                </>
              )}
            </div>
            <hr></hr>
            <h2>
              <center>For Admin</center>
            </h2>
            {/*set member unit */}
            <div className="space-y-2">
              <div className="badge badge-primary">Set Member Unit/Only Repo Owner</div>
              <button className="w-full flex mx-auto btn btn-secondary" onClick={openUpdateMemberUnitsModel}>
                Update Member Units
              </button>
            </div>

            {/* create pool */}
            <div className="space-y-2">
              <div className="badge badge-primary">Create Pool/Only Repo Owner</div>
              <button
                className="w-full flex mx-auto btn btn-accent"
                disabled={isCreatePoolLoading}
                onClick={createPool}
              >
                Create Pool
              </button>
            </div>
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
