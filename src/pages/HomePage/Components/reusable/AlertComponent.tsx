import React from 'react';

// Define a type for the alert types
type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  message: string;
  type: AlertType;
  onClose: () => void;
}

const AlertComp: React.FC<AlertProps> = ({ message, type, onClose }) => {
  // Define styles for each alert type
  const alertStyles = {
    success: 'bg-green-100 text-green-800 border-green-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  return (
    <div
      className={`flex items-center p-4 mb-4 border-l-4 rounded-lg ${alertStyles[type]}`}
      role="alert"
    >
      <div className="flex-1">
        <strong className="font-bold capitalize">{type}</strong>
        <p>{message}</p>
      </div>
      <button
        onClick={onClose}
        className="ml-4 text-lg text-gray-500 hover:text-gray-700"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
};

export default AlertComp;
