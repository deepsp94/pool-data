import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import { getBlockTimestampByHeight, getLatestHeight, initLCD, queryRawContract, querySmartContract } from "@/libs/lcd";
import { num } from "@/libs/num";

import fs from "fs";

type NativeAsset = {
  native_token: {
    denom: string;
  };
};

type CW20Asset = {
  token: {
    contract_addr: string;
  };
};

type AssetInfo = NativeAsset | CW20Asset;

type PoolInfo = {
  assets: {
    info: AssetInfo;
    amount: string;
  }[];
  total_share: string;
};

type PCLPoolRawConfig = {
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

async function main() {
  initLCD("https://rest.injective-main-archive.ccvalidators.com");

  const THIRTHY_MINUTES_IN_BLOCKS = 1800;
  const ONE_DAY_IN_BLOCKS = 86400;
  const latestHeight = Number((await getLatestHeight()) || "0");

  const POOL_ADDRESS = "inj1c95v0zr7ah777qn05sqwfnd03le4f40rucs0dp";

  const fileContents = fs.readFileSync("src/astroport_LPs.csv", "utf8");
  const rows = fileContents.split("\n").map((line) => line.split(","));
  rows.shift();

  let lowHeight = Infinity;
  let highHeight = 0;
  for (const row of rows) {
    const height = Number(row[1]);
    if (height < lowHeight) {
      lowHeight = height;
    }
    if (height + ONE_DAY_IN_BLOCKS * 60 > highHeight) {
      highHeight = height + ONE_DAY_IN_BLOCKS * 60;
    }
  }
  if (highHeight > latestHeight) {
    highHeight = latestHeight;
  }

  console.log(
    [
      "timestamp",
      "block",
      "usdt",
      "inj",
      "total_lp",
      "oracle_price",
      "last_price",
      "price_scale",
      "last_price_update",
      "xcp_profit",
      "xcp_profit_real",
    ].join(","),
  );
  for (let blockHeight = lowHeight; blockHeight <= highHeight; blockHeight += THIRTHY_MINUTES_IN_BLOCKS) {
    const [timestamp, poolInfoResponse, rawConfig] = await Promise.all([
      getBlockTimestampByHeight(blockHeight),
      querySmartContract(
        POOL_ADDRESS,
        {
          pool: {},
        },
        blockHeight,
      ) as Promise<{ data: PoolInfo }>,
      queryRawContract<PCLPoolRawConfig>(POOL_ADDRESS, "config", blockHeight),
    ]);
    const totalLp = num(poolInfoResponse.data.total_share).toString();
    const rows = [
      timestamp,
      blockHeight,
      poolInfoResponse?.data.assets[0]?.amount,
      poolInfoResponse?.data.assets[1]?.amount,
      totalLp,
      rawConfig?.pool_state.price_state.oracle_price,
      rawConfig?.pool_state.price_state.last_price,
      rawConfig?.pool_state.price_state.price_scale,
      rawConfig?.pool_state.price_state.last_price_update,
      rawConfig?.pool_state.price_state.xcp_profit,
      rawConfig?.pool_state.price_state.xcp_profit_real,
    ];

    console.log(rows.join(","));
  }
}

main().catch(console.error);
