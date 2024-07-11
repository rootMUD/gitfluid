import { StateCreator, create } from "zustand";
import { persist } from "zustand/middleware";
import { Repo } from "~~/components/githubSuperfilud/GithubShow";
import scaffoldConfig from "~~/scaffold.config";
import { ChainWithAttributes } from "~~/utils/scaffold-eth";

/**
 * Zustand Store
 *
 * You can add global state to the app using this useGlobalState, to get & set
 * values from anywhere in the app.
 *
 * Think about it as a global useState.
 */

type GlobalState = {
  nativeCurrency: {
    price: number;
    isFetching: boolean;
  };
  setNativeCurrencyPrice: (newNativeCurrencyPriceState: number) => void;
  setIsNativeCurrencyFetching: (newIsNativeCurrencyFetching: boolean) => void;
  targetNetwork: ChainWithAttributes;
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => void;
};

export const useGlobalState = create<GlobalState>(set => ({
  nativeCurrency: {
    price: 0,
    isFetching: true,
  },
  setNativeCurrencyPrice: (newValue: number): void =>
    set(state => ({ nativeCurrency: { ...state.nativeCurrency, price: newValue } })),
  setIsNativeCurrencyFetching: (newValue: boolean): void =>
    set(state => ({ nativeCurrency: { ...state.nativeCurrency, isFetching: newValue } })),
  targetNetwork: scaffoldConfig.targetNetworks[0],
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => set(() => ({ targetNetwork: newTargetNetwork })),
}));
type RepoWithDetails = Repo[];
interface ReposWithDetailsState {
  reposWithDetails: RepoWithDetails;
  addReposWithDetails: (repo: Repo) => void;
  removeReposWithDetails: (index: number) => void;
  removeAllRepos: () => void;
}

const reposWithDetailsStore: StateCreator<ReposWithDetailsState, [["zustand/persist", unknown]]> = set => ({
  reposWithDetails: [],
  addReposWithDetails: (repo: Repo) => {
    set(state => ({
      reposWithDetails: [...state.reposWithDetails, repo],
    }));
  },
  removeReposWithDetails: (index: number) => {
    set(state => ({
      reposWithDetails: state.reposWithDetails.filter((_, i) => i !== index),
    }));
  },
  removeAllRepos: () => {
    set(() => ({
      reposWithDetails: [],
    }));
  },
});
export const useReposWithDetailsStore = create<ReposWithDetailsState>(
  persist(reposWithDetailsStore, { name: "reposWithDetails" }) as any,
);
