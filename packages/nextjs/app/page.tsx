"use client";

import { useEffect, useState } from "react";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import type { NextPage } from "next";
import { fetchDistributionOfRepo, fetchRepoAddress, fetchRepos } from "~~/components/GithubFetcher";
import { GithubShow } from "~~/components/githubSuperfilud/GithubShow";

const Home: NextPage = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadRepositories = async () => {
    setLoading(true);
    try {
      const repos = await fetchRepos();
      if (repos && repos.length > 0) {
        const repoDetails = await Promise.all(
          repos.map(async (repo: { owner: any; name: any }) => {
            // Fetch additional details for each repository
            const repoAddress = await fetchRepoAddress(repo.owner, repo.name);
            const distributionRules = await fetchDistributionOfRepo(repo.owner, repo.name);
            console.log(repoAddress);
            console.log(distributionRules);
            return {
              title: repo.name,
              description: repoAddress.bio,
              ethAddress: repoAddress.eth_addr,
              distributionRulesJSON: distributionRules.distribution_rules_json,
              distributionRulesMD: distributionRules.distribution_rules_md,
              poolAddress: distributionRules.pool_addr,
            };
          }),
        );
        setRepositories(repoDetails);
      } else {
        console.error("No data returned from the server");
        setRepositories([]); // Ensure state is updated even with no data
      }
    } catch (error) {
      console.error("Failed to load repositories:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRepositories();
  }, []);
  const client = new ApolloClient({
    uri: "https://optimism-mainnet.subgraph.x.superfluid.dev",
    cache: new InMemoryCache(),
  });
  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center">
          Loading<span className="loading loading-dots loading-xs"></span>
        </div>
      ) : (
        <ApolloProvider client={client}>
          <GithubShow repositories={repositories} />
        </ApolloProvider>
      )}
    </>
  );
};

export default Home;
