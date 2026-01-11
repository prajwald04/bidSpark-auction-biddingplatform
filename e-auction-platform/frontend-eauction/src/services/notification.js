import websocketService from './websocket';
import api from './api';

export function connectNotifications(onConnected, onError) {
  websocketService.connect(onConnected, onError);
}

export function disconnectNotifications() {
  websocketService.disconnect();
}

export function subscribeUserNotifications(userId, callback) {
  return websocketService.subscribe(`/user/${userId}/notifications`, callback);
}

export function subscribeAuctionUpdates(auctionId, callback) {
  return websocketService.subscribe(`/topic/auction/${auctionId}`, callback);
}

export function unsubscribe(destination) {
  websocketService.unsubscribe(destination);
}

export async function getMyNotifications() {
  const res = await api.get('/api/notifications/my');
  return res.data;
}

export async function markNotificationRead(id, read = true) {
  const res = await api.put(`/api/notifications/${id}/read`, { read });
  return res.data;
}
