// import { useState } from "react";
import { RainbowKitCustomConnectButton } from "../scaffold-eth";
import { Repo } from "./GithubShow";
import { GithubSuperfluidPool } from "./GithubSuperfliudPool";
// import { GithubSuperfluidStream } from "./GithubSuperfluidStream";
// import { clsx } from "clsx";
import { useAccount } from "wagmi";

// enum DISTRIBUTION_MODE {
//   // STREAM_MODE = "Stream Mode",
//   POOL_MODE = "Pool Mode",
// }
export const GithubSuperfluid = ({ repo }: { repo: Repo }) => {
  const { address: connectedWallet } = useAccount();
  // const [distrbutionMode, setDistrbutionMode] = useState(DISTRIBUTION_MODE.POOL_MODE);

  console.log(`Creating superfluid stream for address: ${repo.ethAddress}`);
  console.log(`Creating superfluid stream based on rules: ${JSON.stringify(repo.distributionRulesJSON)}`);
  const getFlowRateRatioMap = (repo: Repo) => {
    const flowRateRatioMap = new Map<string, { receiverAddress: `0x${string}`; flowRateRatio: number }>();
    repo.distributionRulesJSON.contributors.forEach(contributor => {
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
    repo.distributionRulesJSON.relatedRepos.forEach(repo => {
      if (flowRateRatioMap.has(repo.addr)) {
        const flowRate = flowRateRatioMap.get(repo.addr);
        if (flowRate) {
          flowRate.flowRateRatio = flowRate.flowRateRatio + repo.distribution_rate;
        }
      } else {
        flowRateRatioMap.set(repo.addr, { receiverAddress: repo.addr, flowRateRatio: repo.distribution_rate });
      }
    });
    return flowRateRatioMap;
  };
  const flowRateRatioMap = getFlowRateRatioMap(repo);
  // const MODE_TABS = [DISTRIBUTION_MODE.POOL_MODE, DISTRIBUTION_MODE.STREAM_MODE];
  return (
    <>
      {/* Not connected to wallet yet */}
      {!connectedWallet && (
        <div className="mt-5 flex w-full justify-center items-center">
          <RainbowKitCustomConnectButton buttonContent="Connect wallet to manage distribution" />
        </div>
      )}
      {/* Connected to wallet */}
      {/* {connectedWallet && (
        <div role="tablist" className="mt-5 tabs tabs-boxed">
          {MODE_TABS.map((mode, index) => {
            return (
              <button
                onClick={() => {
                  setDistrbutionMode(mode);
                }}
                role="tab"
                key={index}
                className={clsx("tab", { "tab-active": mode === distrbutionMode })}
              >
                {mode}
              </button>
            );
          })}
        </div>
      )} */}
      {/* {connectedWallet && distrbutionMode === DISTRIBUTION_MODE.STREAM_MODE && (
        <GithubSuperfluidStream repoAddress={repo.ethAddress} flowRateRatioMap={flowRateRatioMap} />
      )} */}
      {connectedWallet && (
        <GithubSuperfluidPool
          poolAddress={repo.poolAddress}
          repoAddress={repo.ethAddress}
          flowRateRatioMap={flowRateRatioMap}
        />
      )}
    </>
  );
};
