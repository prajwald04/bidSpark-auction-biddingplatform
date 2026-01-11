import { getAuctionBids } from './auction';

export async function getAuctionBidAnalytics(auctionId) {
  const bids = await getAuctionBids(auctionId);
  const count = bids.length;
  const amounts = bids.map((b) => Number(b.amount));
  const highest = amounts.length ? Math.max(...amounts) : 0;
  const avg = amounts.length ? (amounts.reduce((a, c) => a + c, 0) / amounts.length) : 0;
  const lastBidTime = bids.length ? bids[0].bidTime : null;
  return { count, highest, avg, lastBidTime };
}

export function computeSellerKpis(auctions) {
  const total = auctions.length;
  let live = 0;
  let completed = 0;
  let totalBids = 0;
  const now = new Date();
  (auctions || []).forEach((a) => {
    const start = new Date(a.startTime);
    const end = new Date(a.endTime);
    if (now >= start && now <= end) live += 1;
    else if (now > end) completed += 1;
    totalBids += Number(a.bidCount || 0);
  });
  return { total, live, completed, totalBids };
}

