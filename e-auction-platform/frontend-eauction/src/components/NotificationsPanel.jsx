import React from 'react';
import Notification from './Notification';
import './Notification.css';

export default function NotificationsPanel({ notifications = [], onMarkRead, onClose }) {
  return (
    <div className="notifications-container">
      {(notifications || []).map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          time={notification.time}
          read={!!notification.read}
          onMarkRead={() => onMarkRead && onMarkRead(notification.id)}
          onClose={() => onClose && onClose(notification.id)}
        />
      ))}
    </div>
  );
}
