/**
 * Pricing calculation utilities for budget items.
 *
 * The profit model works as follows:
 *   - The user enters a "real price" (cost price).
 *   - The selling price = realPrice / COST_RATIO  (i.e. cost is 65% of selling price).
 *   - The profit    = sellingPrice * PROFIT_RATE (i.e. 35% of selling price).
 *   - The subtotal  = quantity * sellingPrice.
 */

/** Cost represents 65% of the final selling price. */
export const COST_RATIO = 0.65;

/** Profit represents 35% of the final selling price. */
export const PROFIT_RATE = 0.35;

/** Selling price from a given real (cost) price. */
export const calcSellingPrice = (realPrice: number): number =>
  realPrice > 0 ? realPrice / COST_RATIO : 0;

/** Profit amount from a given real (cost) price. */
export const calcProfit = (realPrice: number): number =>
  calcSellingPrice(realPrice) * PROFIT_RATE;

/** Line-item subtotal: quantity * selling price. */
export const calcLineSubtotal = (quantity: number, realPrice: number): number =>
  quantity * calcSellingPrice(realPrice);
