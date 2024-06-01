import Link from "next/link";
import "github-markdown-css";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/card";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";

// Props type definition (optional but recommended for TypeScript)
interface Repo {
  title: string;
  description: string;
  ethAddress: string;
  distributionRulesJSON: any[];
  distributionRulesMD: string;
}

interface GithubShowProps {
  repositories: Repo[];
}

export function GithubShow({ repositories }: GithubShowProps) {
  // Assuming a function `createSuperfluidStream` exists to handle the stream creation
  const createSuperfluidStream = (address, distributionRulesJSON) => {

    console.log(`Creating superfluid stream for address: ${address}`);
    console.log(`Creating superfluid stream based on rules: ${JSON.stringify(distributionRulesJSON)}`);
    // TODO: Here, you would typically call your API or perform the action to create the stream
    // TODO: call createFlow multiple times.
    // set flowRate by the rules. total_flowRate = a * their flowRate + b * their flowRate + c * their flowRate
  };

  const createFlow = (address, flowRate) => {
    const { writeAsync, isLoading } = useScaffoldContractWrite({
      contractName: "CFAv1Forwarder",
      functionName: "createFlow",
      args: ["sender", "receiver", "flowrate", "0x0"],
      value: parseEther("0"),
      onBlockConfirmation: txnReceipt => {
        console.log("📦 Transaction blockHash", txnReceipt.blockHash);
      },
    });
  };

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 md:p-8 lg:p-10">
      {repositories.map((repo, index) => (
        <Card key={index}>
          <CardHeader className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>{repo.title}</CardTitle>
              <CardDescription>{repo.description}</CardDescription>
            </div>
            <Link className="text-gray-900 hover:underline dark:text-gray-50" href="#">
              View
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <EthereumIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{repo.ethAddress}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Distribution Rules</h4>
                <ReactMarkdown className="space-y-1 text-sm text-gray-500 markdown-body dark:text-gray-400">
                  {repo.distributionRulesMD}
                </ReactMarkdown>
              </div>
              {/* TODO: A inputbox for the total flow rate. */}
              <button
                onClick={() => createSuperfluidStream(repo.ethAddress, repo.distributionRulesJSON)}
                className="mt-4 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Create Stream
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function EthereumIcon(props) {
  return (
    <svg {...props} viewBox="0 0 320 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M311.9 199.9l-143.9-84c-2.5-1.5-5.7-1.5-8.3 0l-144 84c-3 1.8-3.9 5.8-2.1 8.8s5.8 3.9 8.8 2.1l135.2-79.1 135.2 79.1c1.4.8 3 1.3 4.6 1.3 2.3 0 4.5-1 6.1-2.9 1.8-3 1-7-2-8.8zM16 227.6l136 79.5v158.7c0 2.7 1.4 5.2 3.8 6.5 1.3 .8 2.7 1.1 4.1 1.1 1.7 0 3.3-.5 4.7-1.4l127.9-75.2v-149.7l-136-79.5c-3-1.8-7-.7-8.8 2.2-1.8 3-.7 7 2.2 8.8l119.6 70V371.1l-111.9 65.7V297.2c0-2.7-1.4-5.2-3.8-6.5-2.4-1.3-5.4-1.1-7.6 .5l-119.6 70V236.3c-.1-2.6-1.5-5-3.9-6.4-2.4-1.4-5.4-1.4-7.9 .2z" />
    </svg>
  );
}
