// GithubFetcher.tsx
import { DistributionRulesJSON } from "./githubSuperfilud/GithubShow";

const API_URL = "https://gitfluid.deno.dev"; // Adjust the API URL according to your environment

export const fetchRepos = async () => {
  try {
    const response = await fetch(`${API_URL}/repos`);
    if (!response.ok) {
      throw new Error("Failed to fetch data from server");
    }
    const data = await response.json();
    console.log("data", data);
    return data as { owner: string; name: string }[];
  } catch (error) {
    console.error("Error fetching user address:", error);
    return null;
  }
};
export const fetchUserAddressFromBio = async (username: string) => {
  try {
    const response = await fetch(`${API_URL}/get_addr_for_user_bio?username=${username}`);
    if (!response.ok) {
      throw new Error("Failed to fetch data from server");
    }
    const data = await response.json();
    return data.result as string;
  } catch (error) {
    console.error("Error fetching user address:", error);
    return null;
  }
};

export const fetchRepoAddress = async (owner: string, repo: string) => {
  try {
    const response = await fetch(`${API_URL}/get_addr_of_repo?owner=${owner}&repo=${repo}`);
    if (!response.ok) {
      throw new Error("Failed to fetch data from server");
    }
    const data = await response.json();
    return data.result as { bio: string; eth_addr: `0x${string}` };
  } catch (error) {
    console.error("Error fetching repository address:", error);
    return null;
  }
};

export const fetchDistributionOfRepo = async (owner: string, repo: string) => {
  try {
    const response = await fetch(`${API_URL}/get_distribution_of_repo?owner=${owner}&repo=${repo}`);
    if (!response.ok) {
      throw new Error("Failed to fetch data from server");
    }
    const data = await response.json();
    console.log("repo info", data);
    return data.result as {
      distribution_rules_json: DistributionRulesJSON;
      distribution_rules_md: string;
      pool_addr: `0x${string}`;
    };
  } catch (error) {
    console.error("Error fetching distribution of repository:", error);
    return null;
  }
};
