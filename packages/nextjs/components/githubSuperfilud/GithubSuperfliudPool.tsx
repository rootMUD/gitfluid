import { useEffect, useRef, useState } from "react";
import { GithubSuperfluidPoolMemberUnitUpdate } from "./GithubSuperfliudPoolMemberUpdate";
import { gql, useQuery } from "@apollo/client";
import "github-markdown-css";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
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
  const [poolAdderess, setPoolAdderess] = useState("");
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
    refetch,
    isFetching: isConnectReadLoading,
    data: isConnectReadData,
  } = useScaffoldReadContract({
    contractName: "GDAv1Forwarder",
    functionName: "isMemberConnected",
    args: [poolAdderess, senderAddress],
  });
  const GET_POOL_CREATED = gql`
    query MyQuery {
      pools(first: 10, where: { admin: "${senderAddress?.toLocaleLowerCase()}" }) {
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
          senderAddress,
          {
            transferabilityForUnitsOwner: false,
            distributionFromAnyAddress: false,
          },
        ],
      },
      {
        onBlockConfirmation: txnReceipt => {
          console.log("📦 Transaction blockHash", txnReceipt.blockHash);
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
        args: [poolAdderess, "0x0"],
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
          args: [NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, senderAddress, poolAdderess, distributeFlowRate, "0x0"],
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

  const openUpdateMemberUnitsModel = () => {
    modalRef.current && modalRef.current.showModal();
  };

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

  useEffect(() => {
    if (createdPoolsInfo && createdPoolsInfo.pools && createdPoolsInfo.pools.length) {
      setPoolAdderess(createdPoolsInfo.pools[0]?.id);
    }
  }, [createdPoolsInfo]);

  useEffect(() => {
    if (senderAddress && [...flowRateRatioMap.keys()].includes(senderAddress)) {
      refetch();
    }
  }, [poolAdderess, senderAddress]);
  return (
    <>
      <div className="mt-5 space-y-5">
        {getCreatedPoolsInfoLoading && <div>Loading...</div>}
        {isConnectReadLoading && <div>Get connect pool status loading...</div>}
        {createdPoolsInfo && createdPoolsInfo.pools && createdPoolsInfo.pools.length && (
          <div>
            <h3>Created Pool Address:</h3>
            <p className="break-all">{createdPoolsInfo.pools[0]?.id}</p>
            {senderAddress && [...flowRateRatioMap.keys()].includes(senderAddress) && (
              <p> Current account connected:{isConnectReadData ? "true" : "false"}</p>
            )}
          </div>
        )}
        {!getCreatedPoolsInfoLoading && poolAdderess && (
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
            <button
              disabled={isDistributePoolLoading}
              onClick={distributeFlow}
              className="btn btn-success btn-outline ml-2"
            >
              Distribute
            </button>
          </div>
        )}
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

        {/* member unit */}
        {repoAddress === senderAddress &&
          !getCreatedPoolsInfoLoading &&
          (poolAdderess ? (
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
                    poolAdderess={poolAdderess}
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
