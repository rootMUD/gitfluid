"use client";

import { useState } from "react";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import type { NextPage } from "next";
import { fetchDistributionOfRepo, fetchRepoAddress } from "~~/components/GithubFetcher";
import { GithubShow } from "~~/components/githubSuperfilud/GithubShow";
import { useReposWithDetailsStore } from "~~/services/store/store";

const Home: NextPage = () => {
  const repositories = useReposWithDetailsStore(state => state.reposWithDetails);
  const addRepo = useReposWithDetailsStore(state => state.addReposWithDetails);
  const removeRepo = useReposWithDetailsStore(state => state.removeReposWithDetails);
  const removeAllRepo = useReposWithDetailsStore(state => state.removeAllRepos);
  const [loading, setLoading] = useState(false);
  const [repoLink, setRepoLink] = useState("https://github.com/rootMUD/gitfluid/");
  const loadRepotoRepositories = async (repoUrl: string) => {
    setLoading(true);
    try {
      if (repoUrl) {
        const [owner, name] = new URL(repoUrl).pathname.split("/").slice(1, 3);
        if (
          repositories &&
          repositories.length > 0 &&
          repositories.find(repo => repo.owner === owner && repo.name === name)
        ) {
          (document.getElementById("repeat-warning-model") as HTMLDialogElement)?.showModal();
          setLoading(false);
          return;
        }
        // Fetch additional details for each repository
        const repoInfo = await fetchRepoInfo(owner, name);
        addRepo(repoInfo);
      } else {
        console.error(`No data url:${repoUrl}`);
      }
    } catch (error) {
      (document.getElementById("error-load-model") as HTMLDialogElement)?.showModal();
      console.error("Failed to load repositories:", error);
    }
    setLoading(false);
  };
  const fetchRepoInfo = async (repoOwner: string, repoName: string) => {
    const repoInfo = await fetchRepoAddress(repoOwner, repoName);
    const distributionRules = await fetchDistributionOfRepo(repoOwner, repoName);
    console.log(repoInfo);
    console.log(distributionRules);
    if (repoInfo && distributionRules) {
      return {
        owner: repoOwner,
        name: repoName,
        title: repoName,
        description: repoInfo.bio,
        ethAddress: repoInfo.eth_addr,
        distributionRulesJSON: distributionRules.distribution_rules_json,
        distributionRulesMD: distributionRules.distribution_rules_md,
        poolAddress: distributionRules.pool_addr,
      };
    } else {
      throw new Error("Failed to fetch data");
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRepoLink(event.target.value);
  };

  const handleLoadRepo = () => {
    loadRepotoRepositories(repoLink);
  };

  const client = new ApolloClient({
    uri: "https://optimism-mainnet.subgraph.x.superfluid.dev",
    cache: new InMemoryCache(),
  });

  return (
    <>
      <div className="flex justify-center items-center my-4">
        <input
          type="text"
          value={repoLink}
          onChange={handleInputChange}
          placeholder="Enter GitHub repo link (e.g., https://github.com/owner/repo)"
          className="input input-bordered input-primary w-96"
        />
        <button disabled={loading} onClick={handleLoadRepo} className="btn btn-primary ml-2 w-52">
          {loading ? (
            <span className="flex justify-center items-center">
              Loading<span className="loading loading-dots loading-xs"></span>
            </span>
          ) : (
            <span>Load Repository</span>
          )}
        </button>
        <button
          onClick={() => {
            (document.getElementById("remove-warning-model") as HTMLDialogElement)?.showModal();
          }}
          className="btn btn-warning ml-2 w-52"
        >
          Remove All Repository
        </button>
      </div>
      <ApolloProvider client={client}>
        {repositories.length > 0 ? (
          <GithubShow removeRepoHandle={removeRepo} repositories={repositories} />
        ) : (
          <div className="mx-auto">
            <div role="alert" className="alert">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-info h-6 w-6 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>No repositories found, please load new repository.</span>
            </div>
          </div>
        )}
      </ApolloProvider>
      <dialog id="repeat-warning-model" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">warning</h3>
          <p className="py-4">The repository has been loaded!</p>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn">Ok</button>
            </form>
          </div>
        </div>
      </dialog>
      <dialog id="remove-warning-model" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">warning</h3>
          <p className="py-4">Are you sure to remove all repositories?</p>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button onClick={removeAllRepo} className="btn">
                Yes, I want to remove
              </button>
            </form>
          </div>
        </div>
      </dialog>
      <dialog id="error-load-model" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">error</h3>
          <p className="py-4">Can not find this repository.</p>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button onClick={removeAllRepo} className="btn">
                Ok
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
};

export default Home;
