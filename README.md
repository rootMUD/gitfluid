# 🏗 Gitfluid

Distribute tokens for GitHub repos and contributors by stream way based on `README.md`

<h4 align="center">
  <a href="https://gitfluid.rootmud.xyz"> -[ Lanuch App ]- </a>
</h4>

🐱 See the contracts information:

> https://console.superfluid.finance/optimism-mainnet/protocol

🐒 The document about the distribution by Superfluid(Instant Way/Stream Way).

> https://docs.superfluid.finance/docs/protocol/distributions/guides/pools
>
> https://docs.superfluid.finance/docs/technical-reference/SuperTokenV1Library#fn-distribute
>
> https://docs.superfluid.finance/docs/protocol/distributions/overview

Test Token RMUDX: 

> https://optimistic.etherscan.io/address/0xaf921d3d5a903f8b658aeaebed7a30b3dbb5b7bc

Autually Token LeeDuckGoX: 

> https://optimistic.etherscan.io/address/0xfA91DF95b094C7461A625067A4d7af98591AE60c

🐆 Stream and distribute tokens for GitHub repos and contributors! 

## Quickstart

如果您想快速体验我们的功能请通过：<a href="https://bodhi-img.vercel.app">Lanuch App</a>

## Frontend
### Requirements

Before you begin, you need to install the following tools:

- [Node (v18 LTS)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

To get started with Bodhi AI Explorer, follow the steps below:

1. Clone this repo & install dependencies

```
git clone https://github.com/NonceGeek/ai-based-smart-contract-explorer.git
cd ai-based-smart-contract-explorer
yarn install
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `hardhat.config.ts`.

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. The contract is located in `packages/hardhat/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/hardhat/deploy` to deploy the contract to the network. You can also customize the deploy script.

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the contract component or the example ui in the frontend. You can tweak the app config in `packages/nextjs/explorer.config.ts`.

Run smart contract test with `yarn hardhat:test`

- Edit your smart contract `CFAv1Forwarder.sol` in `packages/hardhat/contracts`
- Edit your frontend in `packages/nextjs/pages`
- Edit your deployment scripts in `packages/hardhat/deploy`


## Architecture

// TODO

## Distribution Rules

> Pool Addr: 0x9d11178aF4b363D50E66672bFd3487AEEb98c0B0

* Contributors - 70%

  * [leeduckgo](https://github.com/leeduckgo) - 40%

    💡Core Contributor

  * [fun](https://github.com/yangfan3211) - 60%

    💡Core Contributor

* Related Repos - 30%

  * [bodhi-img](https://github.com/rootMUD/bodhi-img) - 50%

    💡Fork from
    
  * [bodhi-bbs](https://github.com/rootMUD/bodhi-bbs) - 50%
 
    💡Code Ref


