import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Projects",
  description: "The registered projects for gitfluid.",
});

const BlockExplorerLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default BlockExplorerLayout;
