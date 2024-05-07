import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import { normalizeAssetInfo } from "@/helpers";
import { getBlockTimestampByHeight, initLCD, queryRawContract, querySmartContract } from "@/libs/lcd";
import { num } from "@/libs/num";
import { PoolInfo, PCLPoolRawConfig, StablePoolRawConfig } from "./types";
import { writeFileSync } from "fs";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  // Check if the LCD_URL is provided in the .env file
  const lcdUrl = process.env.LCD_URL || "https://rest-kralum.neutron-1.neutron.org/";
  if (!lcdUrl) {
    console.error("LCD_URL is not set in the environment variables. Please set it in the .env file.");
    return; // Exit the function if LCD_URL is not set
  }

  initLCD(lcdUrl);

  const POOL_ADDRESS = "neutron1adk7gupr0thjr3e6wcnlxr7ugclcg4cukv2np8la29dz38zuzymqjcv5s4";
  const START_BLOCK_HEIGHT = 9769085 - 2;
  const END_BLOCK_HEIGHT = 9769085;

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
      queryRawContract<StablePoolRawConfig>(POOL_ADDRESS, "config", blockHeight),
      // querySmartContract(
      //   POOL_ADDRESS,
      //   {
      //     compute_d: {},
      //   },
      //   blockHeight,
      // ) as Promise<{ data: string }>,
    ]);

    const [simulateAB, simulateBA] = await Promise.all([
      querySmartContract(
        POOL_ADDRESS,
        {
          simulation: {
            offer_asset: {
              ...poolInfoResponse.data.assets[0],
              amount: "1000000",
            },
          },
        },
        blockHeight,
      ) as Promise<{
        data: {
          commission_amount: string;
          return_amount: string;
          spread_amount: string;
        };
      }>,
      querySmartContract(
        POOL_ADDRESS,
        {
          simulation: {
            offer_asset: {
              ...poolInfoResponse.data.assets[1],
              amount: "2015369629413999357707",
            },
          },
        },
        blockHeight,
      ) as Promise<{
        data: {
          commission_amount: string;
          return_amount: string;
          spread_amount: string;
        };
      }>,
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
        // "initial_amp",
        // "initial_gamma",
        // "initial_time",
        // "future_amp",
        // "future_gamma",
        // "future_time",
        "price_state:init_amp",
        "price_state:init_amp_time",
        "price_state:next_amp",
        "price_state:next_amp_time",
        // "compute_d",
        "simulate_ab_comission",
        "simulate_ab_return_amount",
        "simulate_ab_spread",
        "simulate_ba_comission",
        "simulate_ba_return_amount",
        "simulate_ba_spread",
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
        // rawConfig.pool_state.initial.amp,
        // rawConfig.pool_state.initial.gamma,
        // rawConfig.pool_state.initial_time,
        // rawConfig.pool_state.future.amp,
        // rawConfig.pool_state.future.gamma,
        // rawConfig.pool_state.future_time,
        rawConfig.init_amp,
        rawConfig.init_amp_time,
        rawConfig.next_amp,
        rawConfig.next_amp_time,
        // computeD.data,
        simulateAB.data.commission_amount,
        simulateAB.data.return_amount,
        simulateAB.data.spread_amount,
        simulateBA.data.commission_amount,
        simulateBA.data.return_amount,
        simulateBA.data.spread_amount,
      ];
      console.log(row.join(","));
      data.push(row);

      await sleep(10); // Milliseconds
    }

    const csvContent = data.map((row) => row.join(",")).join("\n");

    writeFileSync("price_data.csv", csvContent);

    console.log("Data saved to price_data.csv");
  }

  // console.log("Data", JSON.stringify(data, null, 2));
}

main().catch(console.error);
