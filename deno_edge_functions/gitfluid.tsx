/* export APIs to the Bodhi ecology, including the follow APIs:
- read bodhi text assets
- read bodhi pic assets
- read bodhi assets sliced
- read bodhi spaces
- using bodhi as a auth? That may be c00l.
*/
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// for ether
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("Hello from Gitfluid!");

async function fetchGistContentById(gistId) {
  const githubToken = Deno.env.get("GITHUB_TOKEN"); // Ensure your GitHub token is available in environment variables

  if (!githubToken) {
    console.error("GitHub token is not set.");
    return {
      error: "GitHub token is not set.",
      content: null
    };
  }

  const url = `https://api.github.com/gists/${gistId}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${githubToken}`,
      Accept: "application/vnd.github.v3+json"
    },
  });

  if (!response.ok) {
    console.error(`Failed to fetch Gist data: ${response.statusText}`);
    return {
      error: `Failed to fetch Gist data: ${response.statusText}`,
      content: null
    };
  }

  const gistData = await response.json();
  // Assuming we want the content of all files in the Gist:
  const files = Object.values(gistData.files).map(file => ({
    filename: file.filename,
    content: file.content
  }));

  return {
    error: null,
    files: files
  };
}

function extractOwnerFromUrl(url) {
  const pathParts = new URL(url).pathname.split("/").filter((part) => part);
  return pathParts[0];
}

function extractOwnerAndRepoFromUrl(url) {
  const pathParts = new URL(url).pathname.split("/").filter((part) => part);
  if (pathParts.length >= 2) {
    return {
      repoOwner: pathParts[0],
      repoName: pathParts[1],
    };
  } else {
    throw new Error("Invalid GitHub URL provided");
  }
}

async function parseDistributionRules(readmeContent) {
  // Regex to find the distribution percentage for "Contributors" and "Related Repos"
  const contributorsRegex = /Contributors - (\d+)%/;
  const relatedReposRegex = /Related Repos - (\d+)%/;

  const contributorsMatch = contributorsRegex.exec(readmeContent);
  const relatedReposMatch = relatedReposRegex.exec(readmeContent);

  const contributorsRate = contributorsMatch
    ? parseFloat(contributorsMatch[1]) / 100
    : 0;
  const overallRate = relatedReposMatch
    ? parseFloat(relatedReposMatch[1]) / 100
    : 0;

  // Initialize arrays to hold parsed data
  let relatedRepos = [];
  let contributors = [];

  // Regex to extract details of each entity
  const entityRegex =
    /\* \[(.+?)\]\((https:\/\/github\.com\/(.+?))\) - (\d+)%/g;
  let match;

  while ((match = entityRegex.exec(readmeContent)) !== null) {
    const [_, name, url, path, rate] = match;
    const ratePercentage = parseFloat(rate) / 100;

    // Determine the type of entity by analyzing the URL path
    const pathParts = path.split("/");
    console.log(pathParts);
    const isContributor = pathParts.length === 1 && !path.includes("/");

    // Determine the effective distribution rate based on the section
    const effectiveRate = isContributor
      ? contributorsRate * ratePercentage
      : overallRate * ratePercentage;

    // Handle based on type
    if (isContributor) {
      // Assuming extractEthereumAddressFromUser function exists

      const addr = await extractEthereumAddressFromUser(
        extractOwnerFromUrl(url)
      );
      contributors.push({
        name,
        url,
        distribution_rate: effectiveRate,
        addr: addr,
      });
    } else {
      // Assuming extractEthereumAddressFromRepo function exists
      const { repoOwner: repoOwner, repoName: repoName } =
        extractOwnerAndRepoFromUrl(url);
      const addr = await extractEthereumAddressFromRepo(repoOwner, repoName);
      relatedRepos.push({
        name,
        url,
        distribution_rate: effectiveRate,
        addr: addr,
      });
    }
  }

  return {
    contributors: contributors,
    relatedRepos: relatedRepos,
  };
}

async function extractEthereumAddressFromUser(username) {
  const githubToken = Deno.env.get("GITHUB_TOKEN"); // Ensure your GitHub token is available in environment variables

  if (!githubToken) {
    console.error("GitHub token is not set.");
    return { error: "GitHub token is not set." };
  }

  const response = await fetch(`https://api.github.com/users/${username}`, {
    headers: { Authorization: `token ${githubToken}` },
  });

  if (!response.ok) {
    console.error(`Failed to fetch GitHub user data: ${response.statusText}`);
    return {
      error: `Failed to fetch GitHub user data: ${response.statusText}`,
    };
  }

  const userData = await response.json();
  const biography = userData.bio || ""; // Ensure bio is not undefined

  // Regular expression to match an Ethereum address
  const regex = /0x[a-fA-F0-9]{40}/;
  const match = biography.match(regex);

  if (match) {
    return match[0]; // Return the first match found
  } else {
    return "not found"; // Return "not found" if no address is found
  }
}

async function extractEthereumAddressFromRepo(owner, repo) {
  const githubToken = Deno.env.get("GITHUB_TOKEN"); // Ensure your GitHub token is available in environment variables

  if (!githubToken) {
    console.error("GitHub token is not set.");
    return "GitHub token is not set.";
  }

  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    console.error(`Failed to fetch repository data: ${response.statusText}`);
    return `Failed to fetch repository data: ${response.statusText}`;
  }

  const repoData = await response.json();
  return extractEthereumAddress(repoData.description);
}

function extractEthereumAddress(bioText) {
  // Regular expression to match an Ethereum address
  const regex = /0x[a-fA-F0-9]{40}/;

  // Use the regex to find a match in the bio text
  const match = bioText.match(regex);

  // If a match is found, return the Ethereum address
  if (match) {
    return match[0];
  }

  // If no match is found, return "not found"
  return "not found addr in bio";
}

function extractDistributionRulesSection(markdownContent) {
  // Regular expression to extract everything under "## Distribution Rules"
  // until another "##" heading or the end of the file
  const distributionSectionRegex = /## Distribution Rules([\s\S]*?)(?=\n##|$)/;
  const matches = distributionSectionRegex.exec(markdownContent);

  if (matches && matches[1]) {
    return matches[1]; // Return the content of the distribution rules section
  }

  return ''; // Return empty string if no distribution rules section is found
}

const router = new Router();

router
  .get("/gist", async (context) => {
    const queryParams = context.request.url.searchParams;
    const id = queryParams.get("id");
    const result = await fetchGistContentById(id);

    if (result.error) {
      context.response.status = 500;
      context.response.body = result.error;
    } else {
      context.response.body = { files: result.files };
    }
  })
  .get("/repos", async (context) => {
    // * get all the repos.
    const supabase = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get("SUPABASE_URL") ?? "",
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      // Create client with Auth context of the user that called the function.
      // This way your row-level-security (RLS) policies are applied.
      // { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Querying data from Supabase
    const { data, error } = await supabase
      .from("gitfluid_github_repos")
      .select("*")

    if (error) {
      console.error("Error fetching data:", error);
      context.response.status = 500;
      context.response.body = "Failed to fetch data";
      return;
    }

    context.response.body = data;
  })
  .get("/get_addr_for_user_bio", async (context) => {
    const queryParams = context.request.url.searchParams;
    const username = queryParams.get("username");
    const githubToken = Deno.env.get("GITHUB_TOKEN"); // Ensure your GitHub token is available in environment variables

    if (!githubToken) {
      context.response.status = 500;
      context.response.body = "GitHub token is not set.";
      return;
    }

    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: { Authorization: `token ${githubToken}` },
    });

    console.log(response);

    if (!response.ok) {
      context.response.status = response.status;
      context.response.body = "Failed to fetch GitHub user data.";
      return;
    }

    const userData = await response.json();
    const biography = userData.bio; // Extracting the biography field from the response

    context.response.body = { result: extractEthereumAddress(biography) };
  })
  .get("/get_addr_of_repo", async (context) => {
    const queryParams = context.request.url.searchParams;
    const owner = queryParams.get("owner");
    const repoName = queryParams.get("repo");
    const githubToken = Deno.env.get("GITHUB_TOKEN"); // Ensure your GitHub token is available in environment variables

    if (!githubToken) {
      console.error("GitHub token is not set.");
      return "GitHub token is not set.";
    }

    const url = `https://api.github.com/repos/${owner}/${repoName}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch repository data: ${response.statusText}`);
      return `Failed to fetch repository data: ${response.statusText}`;
    }

    const repoData = await response.json();
    context.response.body = {
      result: {
        "eth_addr": extractEthereumAddress(repoData.description),
        "bio": repoData.description,
      },
    };
  })
  .get("/get_distribution_of_repo", async (context) => {
    const queryParams = context.request.url.searchParams;
    const owner = queryParams.get("owner");
    const repoName = queryParams.get("repo");
    const githubToken = Deno.env.get("GITHUB_TOKEN");
  
    if (!githubToken) {
      context.response.status = 500;
      context.response.body = "GitHub token is not set.";
      return;
    }
  
    const url = `https://api.github.com/repos/${owner}/${repoName}/readme`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3.raw",
      },
    });
  
    if (!response.ok) {
      console.error(`Failed to fetch README.md: ${response.statusText}`);
      context.response.status = response.status;
      context.response.body = `Failed to fetch README.md: ${response.statusText}`;
      return;
    }
  
    const content = await response.text();
    const poolAddrMatch = content.match(/> Pool Addr: (\w{42})/);
    const poolAddr = poolAddrMatch ? poolAddrMatch[1] : "Not found";
  
    let distributionRulesJSON = await parseDistributionRules(content);
    let distributionRulesMD = extractDistributionRulesSection(content);
  
    context.response.body = {
      result: {
        "pool_addr": poolAddr, // Extracted Pool Address
        "distribution_rules_json": distributionRulesJSON,
        "distribution_rules_md": distributionRulesMD,
      },
    };
  })

const app = new Application();
app.use(oakCors()); // Enable CORS for All Routes
app.use(router.routes());

console.info("CORS-enabled web server listening on port 8000");
await app.listen({ port: 8000 });
