export type NativeAsset = {
  native_token: {
    denom: string;
  };
};

export type CW20Asset = {
  token: {
    contract_addr: string;
  };
};

export type AssetInfo = NativeAsset | CW20Asset;

export type PoolInfo = {
  assets: {
    info: AssetInfo;
    amount: string;
  }[];
  total_share: string;
};

export type StablePoolRawConfig = {
  init_amp: number;
  init_amp_time: number;
  next_amp: number;
  next_amp_time: number;
};

export type PCLPoolRawConfig = {
  pool_params: {
    mid_fee: string;
    out_fee: string;
    fee_gamma: string;
  };
  pool_state: {
    initial: {
      amp: string;
      gamma: string;
    };
    future: {
      amp: string;
      gamma: string;
    };
    future_time: number;
    initial_time: number;
    price_state: {
      oracle_price: string;
      last_price: string;
      price_scale: string;
      last_price_update: number;
      xcp_profit: string;
      xcp_profit_real: string;
    };
  };
};

export type PoolRawConfig = StablePoolRawConfig | PCLPoolRawConfig;

export const PROVIDE_LIQUIDITY_EVENT_TYPE = "provide-liquidity";

export type ProvideLiquidityEventData = {
  dataType: typeof PROVIDE_LIQUIDITY_EVENT_TYPE;
  dataIndex: number;
  poolAddress: string;
  senderAddress: string | null;
  receiverAddress: string | null;
  assetAmounts: string[];
  lpTokenAmount: string | null;
};

export const WITHDRAW_LIQUIDITY_EVENT_TYPE = "withdraw-liquidity";

export type WithdrawLiquidityEventData = {
  dataType: typeof WITHDRAW_LIQUIDITY_EVENT_TYPE;
  dataIndex: number;
  poolAddress: string;
  senderAddress: string | null;
  lpTokenAmount: string | null;
  assetAmounts: string[];
};

export const SWAP_EVENT_TYPE = "swap";

export type SwapEventData = {
  dataType: typeof SWAP_EVENT_TYPE;
  dataIndex: number;
  poolAddress: string;
  senderAddress: string | null;
  receiverAddress: string | null;
  offerAsset: string | null;
  offerAmount: string | null;
  askAsset: string | null;
  returnAmount: string | null;
  taxAmount: string | null;
  spreadAmount: string | null;
  commissionAmount: string | null;
  makerFeeAmount: string | null;
};
