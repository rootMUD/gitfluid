type SuperTokenInfo = {
  symbol: string;
  network: string;
  address: `0x${string}`;
};
export const TOKEN_CONFIG: SuperTokenInfo[] = [
  {
    symbol: "WBTCx",
    network: "Optimism",
    address: process.env.NEXT_PUBLIC_OP_SUPER_WRAPPED_BTC_TOKEN_CONTRACT as `0x${string}`,
  },
  {
    symbol: "USDCx",
    network: "Optimism",
    address: process.env.NEXT_PUBLIC_OP_SUPER_USD_COIN_TOKEN_CONTRACT as `0x${string}`,
  },
  {
    symbol: "DAIx",
    network: "Optimism",
    address: process.env.NEXT_PUBLIC_OP_SUPER_DAI_STABLECOIN_TOKEN_CONTRACT as `0x${string}`,
  },
  {
    symbol: "ETHx",
    network: "Optimism",
    address: process.env.NEXT_PUBLIC_OP_SUPER_ETH_TOKEN_CONTRACT as `0x${string}`,
  },
  {
    symbol: "OPx",
    network: "Optimism",
    address: process.env.NEXT_PUBLIC_OP_SUPER_OPTIMISM_TOKEN_CONTRACT as `0x${string}`,
  },
  {
    symbol: "LDGX",
    network: "Optimism",
    address: process.env.NEXT_PUBLIC_OP_LEEDUCKGOX_TOKEN_CONTRACT as `0x${string}`,
  },
];
