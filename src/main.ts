import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import { normalizeAssetInfo } from "@/helpers";
import { getBlockTimestampByHeight, initLCD, queryRawContract, querySmartContract } from "@/libs/lcd";
import { num } from "@/libs/num";

async function main() {
  initLCD("https://rest-kralum.neutron-1.neutron.org/");

  const POOL_ADDRESS = "neutron1j4xpv03fw664mvntlhqnzp5hjqk2nfw00vrgx9qlq97rxc9fu3lqvmszl2";
  const START_BLOCK_HEIGHT = 9160350;
  const END_BLOCK_HEIGHT = 9460350;

  const data: any[] = [];
  for (let blockHeight = START_BLOCK_HEIGHT; blockHeight <= END_BLOCK_HEIGHT; blockHeight += 100) {
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

    if (!poolInfoResponse || !rawConfig) {
      throw new Error("Some error ocurred while fetching data");
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const asset1 = poolInfoResponse.data.assets[0]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const asset2 = poolInfoResponse.data.assets[1]!;

    if (data.length === 0) {
      const row = [
        "timestamp",
        "block_height",
        normalizeAssetInfo(asset1.info),
        normalizeAssetInfo(asset2.info),
        "total_lp",
        "initial_amp",
        "initial_gamma",
        "initial_time",
        "future_amp",
        "future_gamma",
        "future_time",
        "price_state:oracle_price",
        "price_state:last_price",
        "price_state:price_scale",
        "price_state:last_price_update",
        "price_state:xcp_profit",
        "price_state:xcp_profit_real",
      ];
      console.log(row.join(","));
      data.push(row);
    }

    const totalLp = num(poolInfoResponse.data.total_share).toString();

    if (rawConfig) {
      const row = [
        timestamp,
        blockHeight,
        asset1.amount,
        asset2.amount,
        totalLp,
        rawConfig.pool_state.initial.amp,
        rawConfig.pool_state.initial.gamma,
        rawConfig.pool_state.initial_time,
        rawConfig.pool_state.future.amp,
        rawConfig.pool_state.future.gamma,
        rawConfig.pool_state.future_time,
        rawConfig.pool_state.price_state.oracle_price,
        rawConfig.pool_state.price_state.last_price,
        rawConfig.pool_state.price_state.price_scale,
        rawConfig.pool_state.price_state.last_price_update,
        rawConfig.pool_state.price_state.xcp_profit,
        rawConfig.pool_state.price_state.xcp_profit_real,
      ];
      console.log(row.join(","));
      data.push(row);
    }
  }

  // console.log("Data", JSON.stringify(data, null, 2));
}

main().catch(console.error);
