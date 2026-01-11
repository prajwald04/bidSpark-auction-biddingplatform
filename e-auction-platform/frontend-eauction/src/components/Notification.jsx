import React from 'react';
import './Notification.css';

const Notification = ({ message, type, time, read, onMarkRead, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification notification-${type}`}>
      <span className="notification-left">
        {!read && <span className="notification-dot" title="Unread" />}
        <span>
          {message}
          {time ? <span className="notification-time"> — {time}</span> : null}
        </span>
      </span>
      <span className="notification-actions">
        <button className="notification-mark" onClick={onMarkRead}>Mark read</button>
        <button className="notification-close" onClick={onClose}>×</button>
      </span>
    </div>
  );
};

export default Notification;
