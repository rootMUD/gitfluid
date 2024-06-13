import { useState } from "react";
import { Repo } from "./GithubShow";
import { GithubSuperfluidPool } from "./GithubSuperfliudPool";
import { GithubSuperfluidStream } from "./GithubSuperfluidStrem";
import { RainbowKitCustomConnectButton } from "./scaffold-eth";
import { useAccount } from "wagmi";

enum DISTRIBUTION_MODE {
  STREAM_MODE = "stream",
  POOL_MODE = "pool",
}
export const GithubSuperfluid = ({ repo }: { repo: Repo }) => {
  const { address: connectedWallet } = useAccount();
  const [distrbutionMode, setDistrbutionMode] = useState(DISTRIBUTION_MODE.STREAM_MODE);

  console.log(`Creating superfluid stream for address: ${repo.ethAddress}`);
  console.log(`Creating superfluid stream based on rules: ${JSON.stringify(repo.distributionRulesJSON)}`);
  const getFlowRateRatioMap = (repo: Repo) => {
    const flowRateRatioMap = new Map<string, { receiverAddress: string; flowRateRatio: number }>();
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

  return (
    <>
      {/* Not connected to wallet yet */}
      {!connectedWallet && (
        <div className="mt-5 flex w-full justify-center items-center">
          <RainbowKitCustomConnectButton buttonContent="Connect wallet to manage distribution" />
        </div>
      )}
      {/* Connected to wallet */}
      {connectedWallet && (
        <div className="flex justify-start items-center my-5">
          <div className="badge badge-lg badge-primary mr-5">
            {distrbutionMode === DISTRIBUTION_MODE.STREAM_MODE ? "Stream Mode" : "Pool Mode"}
          </div>
          <input
            onChange={e =>
              setDistrbutionMode(e.target.checked ? DISTRIBUTION_MODE.STREAM_MODE : DISTRIBUTION_MODE.POOL_MODE)
            }
            checked={distrbutionMode === DISTRIBUTION_MODE.STREAM_MODE}
            type="checkbox"
            className="toggle dark:[--tglbg:#212638] bg-blue-500 hover:bg-blue-700 border-blue-500"
          />
        </div>
      )}
      {connectedWallet && distrbutionMode === DISTRIBUTION_MODE.STREAM_MODE && (
        <GithubSuperfluidStream repoAddress={repo.ethAddress} flowRateRatioMap={flowRateRatioMap} />
      )}
      {connectedWallet && distrbutionMode === DISTRIBUTION_MODE.POOL_MODE && (
        <GithubSuperfluidPool repoAddress={repo.ethAddress} flowRateRatioMap={flowRateRatioMap} />
      )}
    </>
  );
};
