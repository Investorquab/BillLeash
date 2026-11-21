import { toDataSuffix, fromDataSuffix } from "@celo/attribution-tags";
import { concat, type Hex } from "viem";
import { loadConfig } from "./config.js";

/**
 * ERC-8021 attribution. Every transaction BillLeash sends must carry the
 * developer's loops tag, or loops never counts it. x402 settlements are
 * submitted by the facilitator and cannot be tagged by us (PayTo registration
 * credits those instead) — so we tag everything we broadcast ourselves:
 * Textile FX swaps, ERC-20 approvals, and direct transfers.
 */

/** The data suffix for the configured attribution tag. */
export function tagSuffix(): Hex {
  return toDataSuffix(loadConfig().attributionTag) as Hex;
}

/** Append the attribution suffix to a piece of calldata. */
export function tagCalldata(calldata: Hex): Hex {
  return concat([calldata, tagSuffix()]);
}

/** Decode a tag from raw calldata offline (null if none). */
export function readTag(rawCalldata: Hex) {
  try {
    return fromDataSuffix(rawCalldata);
  } catch {
    return null;
  }
}
