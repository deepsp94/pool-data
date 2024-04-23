import axios from "axios";

export class LCDClient {
  constructor(public readonly url: string) {}

  async ibcDenomTrace(denom: string): Promise<{
    denom_trace: {
      path: string;
      base_denom: string;
    };
  }> {
    const res = await axios.get(`${this.url}/ibc/apps/transfer/v1/denom_traces/${denom}`, {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
    });

    if (res.status !== 200) {
      throw new Error(`failed to query ibc denom trace: ${res.data}`);
    }

    return res.data;
  }

  async querySmartContract<T = unknown>(address: string, query: object, height?: string | number): Promise<T> {
    const encodedQuery = Buffer.from(JSON.stringify(query)).toString("base64");

    const headers: {
      accept: string;
      "content-type": string;
      "x-cosmos-block-height"?: string;
    } = {
      accept: "application/json",
      "content-type": "application/json",
    };
    if (height) {
      headers["x-cosmos-block-height"] = String(height);
    }

    const res = await axios.get(`${this.url}/cosmwasm/wasm/v1/contract/${address}/smart/${encodedQuery}`, {
      headers,
    });

    if (res.status !== 200) {
      throw new Error(`failed to query smart contract: ${res.data}`);
    }

    return res.data;
  }

  async queryRawContract<T = unknown>(address: string, contractKey: string, height?: string | number): Promise<T> {
    const encodedQuery = Buffer.from(contractKey, "utf8").toString("base64");

    const headers: {
      accept: string;
      "content-type": string;
      "x-cosmos-block-height"?: string;
    } = {
      accept: "application/json",
      "content-type": "application/json",
    };
    if (height) {
      headers["x-cosmos-block-height"] = String(height);
    }

    const res = await axios.get(`${this.url}/cosmwasm/wasm/v1/contract/${address}/raw/${encodedQuery}`, {
      headers,
    });

    if (res.status !== 200) {
      throw new Error(`failed to query raw contract: ${res.data}`);
    }

    return JSON.parse(Buffer.from(res.data.data, "base64").toString("utf8")) as T;
  }

  async contractInfo(address: string) {
    const res = await axios.get(`${this.url}/cosmwasm/wasm/v1/contract/${address}`, {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
    });

    if (res.status !== 200) {
      throw new Error(`failed to query smart contract: ${res.data}`);
    }

    const data = res.data as {
      address: string;
      contract_info: {
        code_id: string;
        creator: string;
        admin: string;
        label: string;
        created: {
          block_height: string;
          tx_index: string;
        };
        ibc_port_id: string;
        extension: string | null;
      };
    };

    return data.contract_info;
  }
}

export let lcd: LCDClient;

export function initLCD(url: string): LCDClient {
  lcd = new LCDClient(url);
  return lcd;
}

export async function getLatestHeight(): Promise<string | null> {
  try {
    const res = await axios.get(`${lcd.url}/cosmos/base/tendermint/v1beta1/blocks/latest`, {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
    });
    return res.data.block.header.height;
  } catch (e) {
    console.error("Error calling latest height", e);
    return null;
  }
}

export async function getBlockTimestampByHeight(height: string | number): Promise<string | null> {
  try {
    const res = await axios.get(`${lcd.url}/cosmos/base/tendermint/v1beta1/blocks/${height}`, {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
    });
    return res.data.block.header.time;
  } catch (e) {
    console.error("Error calling block timestamp by height", e);
    return null;
  }
}

export async function querySmartContract<T = unknown>(
  address: string,
  query: object,
  height?: string | number,
): Promise<T | null> {
  try {
    return lcd.querySmartContract<T>(address, query, height);
  } catch (e) {
    console.error("Error calling querySmartContract", e);
    return null;
  }
}

export async function queryRawContract<T = unknown>(
  address: string,
  key: string,
  height?: string | number,
): Promise<T | null> {
  try {
    return lcd.queryRawContract<T>(address, key, height);
  } catch (e) {
    console.error("Error calling queryRawContract", e);
    return null;
  }
}
