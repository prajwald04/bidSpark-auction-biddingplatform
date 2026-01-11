import api from './api';

export async function getMyAuctions() {
  const res = await api.get('/api/auctions/my');
  return res.data;
}

export async function getLiveAuctions() {
  const res = await api.get('/api/auctions/live');
  return res.data;
}

export async function getAllAuctions() {
  const res = await api.get('/api/auctions');
  return res.data;
}

export async function createAuction(payload) {
  const res = await api.post('/api/auctions', payload);
  return res.data;
}

export async function updateAuction(id, payload) {
  const res = await api.put(`/api/auctions/${id}`, payload);
  return res.data;
}

export async function updateAuctionStatus(id, enabled) {
  const res = await api.put(`/api/auctions/${id}/status`, { enabled });
  return res.data;
}

export async function getAuctionBids(auctionId) {
  const res = await api.get(`/api/auctions/${auctionId}/bids`);
  return res.data;
}

export async function getMyBidAuctions() {
  const res = await api.get('/api/auctions/my-bids');
  return res.data;
}

export async function declareWinner(id) {
  const res = await api.put(`/api/seller/auctions/${id}/declare-winner`);
  return res.data;
}
