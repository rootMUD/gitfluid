"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { SearchBar } from "./_components";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import type { NextPage } from "next";
import { fetchDistributionOfRepo, fetchRepoAddress, fetchRepos } from "~~/components/GithubFetcher";
import { GithubShow } from "~~/components/githubSuperfilud/GithubShow";

const BlockExplorer: NextPage = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [repoLink, setRepoLink] = useState("https://github.com/rootMUD/gitfluid/");
  const [viewMode, setViewMode] = useState("gallery"); // State for view mode

  const loadRepositories = async (repoLink = "") => {
    setLoading(true);
    try {
      let repos = [];
      if (repoLink) {
        const [owner, name] = repoLink.split("/").slice(-2);
        repos = [{ owner, name }];
      } else {
        repos = await fetchRepos();
      }

      if (repos && repos.length > 0) {
        const repoDetails = await Promise.all(
          repos.map(async (repo: { owner: any; name: any }) => {
            // Fetch additional details for each repository
            const repoAddress = await fetchRepoAddress(repo.owner, repo.name);
            const distributionRules = await fetchDistributionOfRepo(repo.owner, repo.name);
            console.log(distributionRules);

            return {
              title: repo.name,
              url: `https://github.com/${repo.owner}/${repo.name}`,
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

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRepoLink(event.target.value);
  };

  const handleLoadRepo = () => {
    loadRepositories(repoLink);
  };

  const client = new ApolloClient({
    uri: "https://optimism-mainnet.subgraph.x.superfluid.dev",
    cache: new InMemoryCache(),
  });

  const handleToggleChange = () => {
    setViewMode(viewMode === "gallery" ? "map" : "gallery");
  };

  return (
    <>
      <br />
      <h1 style={{ fontSize: "1.5em" }}>
        <center>
          🚀 See All the projects that <b>has defined the distribution rules yet🚀 </b>
        </center>
      </h1>
      <br />
      <div className="flex justify-center items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label className="switch">
            <input type="checkbox" checked={viewMode === "map"} onChange={handleToggleChange} />
            <span className="slider round"></span>
          </label>
          <span>{viewMode === "gallery" ? "Gallery View" : "Map View"}</span>
        </div>
        <SearchBar className="w-96" />
      </div>
      <br />
      {loading ? (
        <div className="flex justify-center items-center">
          Loading<span className="loading loading-dots loading-xs"></span>
        </div>
      ) : (
        <ApolloProvider client={client}>
          {viewMode === "gallery" ? (
            <GithubShow repositories={repositories} />
          ) : (
            <div>
              {/* Replace with the related map component */}
              <div style={{ width: "100%", height: "auto" }}>
                <center>
                <div
                  dangerouslySetInnerHTML={{
                    __html: `
          <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <style>
    .repo { fill: lightblue; stroke: blue; stroke-width: 2px; }
    .contributor { fill: lightgreen; stroke: green; stroke-width: 2px; }
    .text { font-family: Arial, sans-serif; font-size: 12px; }
    .link { stroke: gray; stroke-width: 2px; }
  </style>

  <!-- Main Repo -->
  <circle cx="300" cy="200" r="20" class="repo" />
  <text x="300" y="200" text-anchor="middle" dy=".3em" class="text">gitfluid</text>
  <a xlink:href="https://github.com/rootMUD/gitfluid/" target="_blank">
    <text x="300" y="200" text-anchor="middle" dy=".3em" class="text" style="text-decoration: underline;">gitfluid</text>
  </a>

  <!-- Contributors -->
  <circle cx="200" cy="100" r="20" class="contributor" />
 
  <a xlink:href="https://github.com/leeduckgo" target="_blank">
    <text x="200" y="100" text-anchor="middle" dy=".3em" class="text" style="text-decoration: underline;">leeduckgo</text> 
  </a>
  <text x="200" y="120" text-anchor="middle" dy=".3em" class="text" >Core Contributor</text>

  <circle cx="400" cy="100" r="20" class="contributor" />
  
  <a xlink:href="https://github.com/yangfan3211" target="_blank">
    <text x="400" y="100" text-anchor="middle" dy=".3em" class="text" style="text-decoration: underline;">fun</text>
  </a>
  <text x="400" y="120" text-anchor="middle" dy=".3em" class="text" >Core Contributor</text>

  <!-- Related Repos -->
  <circle cx="100" cy="300" r="20" class="repo" />
  
  <a xlink:href="https://github.com/rootMUD/bodhi-img" target="_blank">
    <text x="100" y="300" text-anchor="middle" dy=".3em" class="text" style="text-decoration: underline;">bodhi-img</text>
  </a>
  <text x="100" y="320" text-anchor="middle" dy=".3em" class="text" >Fork from</text>

  <circle cx="500" cy="300" r="20" class="repo" />
  
  <a xlink:href="https://github.com/rootMUD/bodhi-bbs" target="_blank">
    <text x="500" y="300" text-anchor="middle" dy=".3em" class="text" style="text-decoration: underline;">bodhi-bbs</text>
  </a>
  <text x="500" y="320" text-anchor="middle" dy=".3em" class="text" >Code Ref</text>

  <!-- Links -->
  <line x1="300" y1="180" x2="200" y2="120" class="link" />
  <line x1="300" y1="180" x2="400" y2="120" class="link" />
  <line x1="300" y1="220" x2="100" y2="280" class="link" />
  <line x1="300" y1="220" x2="500" y2="280" class="link" />

  <!-- Distribution Text -->
  <text x="250" y="150" text-anchor="middle" dy=".3em" class="text">70% * 40%</text>
  <text x="350" y="150" text-anchor="middle" dy=".3em" class="text">70% * 60%</text>
  <text x="200" y="250" text-anchor="middle" dy=".3em" class="text">30% * 50%</text>
  <text x="400" y="250" text-anchor="middle" dy=".3em" class="text">30% * 50%</text>
</svg>
        `,
                  }}
                />
                </center>
              </div>
            </div>
          )}
        </ApolloProvider>
      )}
    </>
  );
};

export default BlockExplorer;
