import Link from "next/link";
import { GithubSuperfluidStream } from "./GithubSuperfluidStrem";
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

interface Repo {
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
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 md:p-8 lg:p-10">
      {repositories.map((repo, index) => (
        <Card key={index} className="h-[36rem] overflow-y-scroll" style={{ scrollbarColor: "#385183 black" }}>
          <CardHeader className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-center">{repo.title}</CardTitle>
              <CardDescription className="break-all">{repo.description}</CardDescription>
            </div>
            <Link className="text-gray-900 hover:underline dark:text-gray-50" href="#">
              View
            </Link>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <GithubSuperfluidStream
              repoAddress={repo.ethAddress}
              distributionRulesJSON={repo.distributionRulesJSON}
              distributionRulesMD={repo.distributionRulesMD}
            />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
