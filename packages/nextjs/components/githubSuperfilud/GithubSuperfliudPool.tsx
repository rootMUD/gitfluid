import { useEffect, useRef, useState } from "react";
import { GithubSuperfluidPoolMemberUnitUpdate } from "./GithubSuperfliudPoolMemberUpdate";
import { gql, useQuery } from "@apollo/client";
import "github-markdown-css";
import { parseEther } from "viem";
import { decodeFunctionResult } from "viem";
import { useAccount } from "wagmi";
import contractABI from "~~/contracts/externalContracts";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface PoolCreatedInfo {
  id: string;
  totalUnits: string;
  totalMembers: number;
  flowRate: string;
  createdAtBlockNumber: string;
  token: {
    id: string;
    isSuperToken: boolean;
    symbol: string;
  };
}
export const GithubSuperfluidPool = ({
  repoAddress,
  flowRateRatioMap,
}: {
  repoAddress: string;
  flowRateRatioMap: Map<string, { receiverAddress: string; flowRateRatio: number }>;
}) => {
  const NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT = "0xAf921d3D5A903F8b658aeAEbeD7a30B3Dbb5B7Bc";
  const { address: senderAddress } = useAccount();
  const [distributeFlowRateInput, setDistributeFlowRateInput] = useState("");
  const [distributeFlowRate, setDistributeFlowRate] = useState(0n);
  const [poolAddress, setPoolAddress] = useState("");
  const [distributeAmountInput, setDistributeAmountInput] = useState<string>("");
  const [distributeAmount, setDistributeAmount] = useState(0n);

  const {
    writeContractAsync: createPoolWriteAsync,
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
    writeContractAsync: distributeAmountWriteAsync,
    isSuccess: isDistributeAmountToPoolSuccess,
    isPending: isDistributeAmountToPoolLoading,
  } = useScaffoldWriteContract("GDAv1Forwarder");
  const {
    refetch,
    isFetching: isConnectReadLoading,
    data: isConnectReadData,
  } = useScaffoldReadContract({
    contractName: "GDAv1Forwarder",
    functionName: "isMemberConnected",
    args: [poolAddress, senderAddress],
  });
  const GET_POOL_CREATED = gql`
    query MyQuery {
      pools(first: 10, where: { admin: "${repoAddress?.toLocaleLowerCase()}" }) {
        id  
        totalUnits
        totalMembers
        flowRate
        createdAtBlockNumber
        token {
          id
          isSuperToken
          symbol
        }
      }
    }
  `;
  const {
    loading: getCreatedPoolsInfoLoading,
    data: createdPoolsInfo,
  }: { loading: boolean; data: { pools: PoolCreatedInfo[] } | undefined } = useQuery(GET_POOL_CREATED);

  console.log("get createdPoolsInfo", createdPoolsInfo, GET_POOL_CREATED.loc?.source.body);
  const modalRef = useRef<HTMLDialogElement>(null);

  const createPool = () => {
    createPoolWriteAsync(
      {
        functionName: "createPool",
        args: [
          NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT,
          repoAddress,
          {
            transferabilityForUnitsOwner: false,
            distributionFromAnyAddress: false,
          },
        ],
      },
      {
        onBlockConfirmation: txnReceipt => {
          console.log("📦 Transaction blockHash", txnReceipt.blockHash);
          const createdPoolAddressData = txnReceipt.logs.find(
            log => log.topics[0] === "0x9c5d829b9b23efc461f9aeef91979ec04bb903feb3bee4f26d22114abfc7335b",
          )?.data;
          if (!poolAddress && createdPoolAddressData) {
            const createdPoolAddress = decodeFunctionResult({
              abi: contractABI[10].GDAv1Forwarder.abi,
              functionName: "createPool",
              data: createdPoolAddressData,
            });
            setPoolAddress(createdPoolAddress as string);
          }
        },
      },
    );
  };

  const connectPool = () => {
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
    disconnectPoolWriteAsync(
      {
        functionName: "disconnectPool",
        args: [poolAddress, "0x0"],
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
          args: [NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, senderAddress, poolAddress, distributeFlowRate, "0x0"],
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
          args: [NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, senderAddress, poolAddress, distributeAmount, "0x0"],
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
    if (createdPoolsInfo && createdPoolsInfo.pools && createdPoolsInfo.pools.length) {
      setPoolAddress(createdPoolsInfo.pools[0]?.id);
    }
  }, [createdPoolsInfo]);

  useEffect(() => {
    if (senderAddress && [...flowRateRatioMap.keys()].includes(senderAddress)) {
      refetch();
    }
  }, [poolAddress, senderAddress]);
  return (
    <>
      <div className="mt-5 space-y-5">
        {/* pool info */}
        {getCreatedPoolsInfoLoading && <div>Loading...</div>}
        {isConnectReadLoading && <div>Get connect pool status loading...</div>}
        {poolAddress ? (
          <div>
            <h3 className="text-blue-500">Created Pool Address:</h3>
            <p className="break-all">{poolAddress}</p>
            {senderAddress && [...flowRateRatioMap.keys()].includes(senderAddress) && (
              <p> Current account connected:{isConnectReadData ? "true" : "false"}</p>
            )}
          </div>
        ) : (
          !getCreatedPoolsInfoLoading && <div className="text-blue-500">No pool created yet</div>
        )}

        {/* distribute */}
        {!getCreatedPoolsInfoLoading && poolAddress && (
          <>
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
          </>
        )}

        {/* connect/disconnect pool */}
        {senderAddress &&
          [...flowRateRatioMap.keys()].includes(senderAddress) &&
          (isConnectReadData ? (
            <button className="w-full flex mx-auto btn btn-primary" onClick={disconnectPool}>
              Disconnect Pool
            </button>
          ) : (
            <button className="w-full flex mx-auto btn btn-primary" onClick={connectPool}>
              Connect Pool
            </button>
          ))}

        {/* create pool/set member unit */}
        {repoAddress === senderAddress &&
          !getCreatedPoolsInfoLoading &&
          (poolAddress ? (
            <button className="w-full flex mx-auto btn btn-secondary" onClick={openUpdateMemberUnitsModel}>
              Update Member Units
            </button>
          ) : (
            <button className="w-full flex mx-auto btn btn-accent" onClick={createPool}>
              Create Pool
            </button>
          ))}
      </div>
      <dialog ref={modalRef} className="modal">
        <div className="modal-box overflow-y-scroll">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-center text-lg">Update Member Units</h3>
          <ul className="break-all list-none space-y-5">
            {[...flowRateRatioMap.values()].map(({ flowRateRatio, receiverAddress }, index) => {
              return (
                <li className="bg-base-300 p-5 rounded-box" key={index}>
                  <GithubSuperfluidPoolMemberUnitUpdate
                    poolAddress={poolAddress}
                    receiver={receiverAddress}
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
