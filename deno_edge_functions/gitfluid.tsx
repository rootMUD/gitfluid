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
import { ethers } from "https://cdn.skypack.dev/ethers@5.6.8";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("Hello from Gitfluid!");

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

const router = new Router();

router
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
      result: extractEthereumAddress(repoData.description),
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
  
    const url = `https://api.github.com/repos/${owner}/${repoName}/contents/README.md`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3.raw", // Use the raw format if you want to get the content directly
      },
    });
  
    if (!response.ok) {
      console.error(`Failed to fetch README.md: ${response.statusText}`);
      context.response.status = response.status;
      context.response.body = `Failed to fetch README.md: ${response.statusText}`;
      return;
    }
  
    const content = await response.text(); // Get the content as text directly because of 'vnd.github.v3.raw'
  
    context.response.body = {
      result: content, // return the decoded content of README.md
    };
  });

const app = new Application();
app.use(oakCors()); // Enable CORS for All Routes
app.use(router.routes());

console.info("CORS-enabled web server listening on port 8000");
await app.listen({ port: 8000 });
