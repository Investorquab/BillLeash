import { loadConfig, token } from "./config.js";
import { toBaseUnits } from "./amounts.js";
import type { Quote } from "./types.js";

/**
 * Textile FX v2 RFQ client (https://api.textilecredit.com).
 *
 * Flow: preview (public, price) -> request (firm quote, needs API key) ->
 * the caller signs & broadcasts the returned tx themselves (non-custodial) ->
 * status. BillLeash uses this to convert a local stablecoin to USD₮ before
 * paying a dollar bill. Celo mainnet (42220) only.
 */
export class TextileFx {
  constructor(
    private api = loadConfig().textileRfqApi,
    private chainId = loadConfig().network.chainId,
  ) {}

  private async post(path: string, body: unknown, apiKey?: string): Promise<any> {
    const res = await fetch(`${this.api}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.error?.message ?? res.statusText;
      throw new Error(`Textile ${path} ${res.status}: ${msg}`);
    }
    return json;
  }

  /**
   * Public price preview. `sell`/`buy` are token symbols from config; `amount`
   * is a human amount in the sell token. No API key required.
   */
  async preview(sell: string, buy: string, amount: string): Promise<Quote> {
    const s = token(sell);
    const b = token(buy);
    const sellAmount = toBaseUnits(amount, s.decimals).toString();
    const r = await this.post("/v2/rfq/preview", {
      chainId: this.chainId,
      sellToken: s.address,
      buyToken: b.address,
      sellAmount,
    });
    const d = r.data ?? r;
    return {
      status: d.status,
      sellToken: s.address,
      buyToken: b.address,
      sellAmount: d.sellAmount,
      buyAmount: d.buyAmount,
      feeAmount: d.feeAmount,
      availableSellAmount: d.availableSellAmount,
      rateRay: d.rateRay,
    };
  }

  /**
   * Firm quote. Needs a Textile test/live API key (from the app profile menu).
   * Returns the executable order + the transaction for the caller to sign and
   * broadcast from the registered agent wallet (with the attribution tag).
   */
  async request(
    sell: string,
    buy: string,
    amount: string,
    apiKey: string,
  ): Promise<any> {
    const s = token(sell);
    const b = token(buy);
    return this.post(
      "/v2/rfq/request",
      {
        chainId: this.chainId,
        sellToken: s.address,
        buyToken: b.address,
        sellAmount: toBaseUnits(amount, s.decimals).toString(),
      },
      apiKey,
    );
  }

  async status(id: string): Promise<any> {
    const res = await fetch(`${this.api}/v2/rfq/${id}`);
    return res.json();
  }
}
