export function normalizeAssetInfo(info: AssetInfo): string {
  if ("native_token" in info) {
    return info.native_token.denom;
  } else {
    return info.token.contract_addr;
  }
}
