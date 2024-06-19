import Link from "next/link";
import { GithubSuperfluid } from "./GithubSuperfliud";
import { EthereumCircleColorful } from "@ant-design/web3-icons";
import "github-markdown-css";
import { useTheme } from "next-themes";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/card";

// Props type definition (optional but recommended for TypeScript)
interface RepoDetail {
  addr: string;
  distribution_rate: number;
  name: string;
  url: string;
}

interface ContributorDetail {
  addr: string;
  distribution_rate: number;
  name: string;
  url: string;
}
export interface DistributionRulesJSON {
  contributors: Array<ContributorDetail>;
  relatedRepos: Array<RepoDetail>;
}

export interface Repo {
  title: string;
  description: string;
  ethAddress: string;
  distributionRulesJSON: DistributionRulesJSON;
  distributionRulesMD: string;
}

interface GithubShowProps {
  repositories: Repo[];
}

export function GithubShow({ repositories }: GithubShowProps) {
  const { theme } = useTheme();
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 md:p-8 lg:p-10">
      {repositories.map((repo, index) => (
        <Card
          key={index}
          className="h-[36rem] overflow-y-scroll"
          style={theme === "dark" ? { scrollbarColor: "#385183 black" } : { scrollbarColor: "#93BBFB white" }}
        >
          <CardHeader className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-center uppercase">{repo.title}</CardTitle>
              <CardDescription className="break-all">{repo.description}</CardDescription>
            </div>
            <Link className="text-gray-900 self-center hover:underline dark:text-gray-50" href="#">
              View
            </Link>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <EthereumCircleColorful />
                <p className="m-0 text-sm text-gray-500 dark:text-gray-400 break-all">{repo.ethAddress}</p>
              </div>
              <h4 className="text-sm font-medium text-center !my-3">Distribution Rules</h4>
              <ReactMarkdown className="!space-y-1 !text-sm !text-gray-500 markdown-body dark:!text-gray-400 !bg-gray-300 dark:!bg-gray-800 rounded-box">
                {repo.distributionRulesMD}
              </ReactMarkdown>
            </div>
            <GithubSuperfluid repo={repo} />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
