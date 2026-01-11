import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

// Use environment variable or fallback to localhost for development
const WS_BASE_URL = process.env.REACT_APP_WS_URL || process.env.REACT_APP_API_URL || 'http://localhost:8080';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.subscriptions = new Map();
  }

  connect(onConnect, onError) {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: (frame) => {
        console.log('Connected to WebSocket:', frame);
        this.connected = true;
        if (onConnect) onConnect();
      },
      onStompError: (frame) => {
        console.error('WebSocket STOMP error:', frame);
        this.connected = false;
        if (onError) onError(frame);
      },
      onWebSocketError: (error) => {
        console.error('WebSocket connection error:', error);
        this.connected = false;
        if (onError) onError(error);
      }
    });

    this.stompClient.activate();
  }

  disconnect() {
    if (this.stompClient && this.connected) {
      this.stompClient.deactivate();
      console.log('Disconnected from WebSocket');
      this.connected = false;
    }
  }

  subscribe(destination, callback) {
    if (this.stompClient && this.connected) {
      const subscription = this.stompClient.subscribe(destination, (message) => {
        const data = JSON.parse(message.body);
        callback(data);
      });
      this.subscriptions.set(destination, subscription);
      return subscription;
    }
    return null;
  }

  unsubscribe(destination) {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  send(destination, body) {
    if (this.stompClient && this.connected) {
      this.stompClient.publish({
        destination: destination,
        body: JSON.stringify(body)
      });
    }
  }

  // Subscribe to auction updates
  subscribeToAuction(auctionId, callback) {
    return this.subscribe(`/topic/auction/${auctionId}`, callback);
  }

  // Subscribe to user notifications
  subscribeToNotifications(userId, callback) {
    return this.subscribe(`/user/${userId}/notifications`, callback);
  }

  // Send a bid
  sendBid(auctionId, bidAmount) {
    this.send('/app/bid', { auctionId, amount: bidAmount });
  }
}

const websocketService = new WebSocketService();
export default websocketService;
