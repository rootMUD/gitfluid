import { useEffect, useState } from "react";
import { NextPage } from "next";
import { GithubShow } from "~~/components/GithubShow";
import { fetchRepos, fetchRepoAddress, fetchDistributionOfRepo, fetchUserAddressFromBio } from "~~/components/GithubFetcher"; // Assuming the path is correct

const ETHSpace: NextPage = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadRepositories = async () => {
    setLoading(true);
    try {
      const repos = await fetchRepos();
      if (repos && repos.length > 0) {
        const repoDetails = await Promise.all(repos.map(async repo => {
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
            distributionRulesMD: distributionRules.distribution_rules_md
          };
        }));
        setRepositories(repoDetails);
      } else {
        console.error("No data returned from the server");
        setRepositories([]);  // Ensure state is updated even with no data
      }
    } catch (error) {
      console.error("Failed to load repositories:", error);
    }
    setLoading(false);
  };  

  useEffect(() => {
    loadRepositories();
  }, []);

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center">
          Loading<span className="loading loading-dots loading-xs"></span>
        </div>
      ) : (
        <GithubShow repositories={repositories} />
      )}
    </>
  );
};

export default ETHSpace;