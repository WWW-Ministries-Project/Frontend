import React, { useEffect, useState } from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/solid'; // Use any icon library you prefer

interface NotificationCardProps {
  title: string;
  description: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ title, description, onClose, type = 'success' }) => {
  const [visible, setVisible] = useState(false); // Start with visibility set to false

  useEffect(() => {
    // Fade in the notification on mount
    setVisible(true);

    // Set a timer to auto-close the notification after 5 seconds
    const timer = setTimeout(() => {
      setVisible(false); // Start fade-out transition
      setTimeout(onClose, 300); // Delay removal to allow animation to finish
    }, 5000); // 5 seconds delay for auto-close

    return () => clearTimeout(timer); // Clean up the timer if the component is unmounted
  }, [onClose]);

  // Define background colors based on notification type
  const backgroundColor = type === 'error' ? 'bg-red-100' : 'bg-[#E0F7FA]';
  const borderColor = type === 'error' ? 'border-red-500' : 'border-[#7E57C2]';
  const iconColor = type === 'error' ? 'text-red-500' : 'text-blue-500';

  return (
    <div 
      className={`flex items-start p-4 border rounded-lg shadow-lg ${backgroundColor} ${borderColor} 
      transform transition-opacity duration-400 ease-in-out 
      ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'} fixed top-5 right-5`}
    >
      {/* Icon */}
      <InformationCircleIcon className={`h-6 w-6 ${iconColor} mr-3`} />
      
      {/* Title and Description */}
      <div className="flex-1">
        <h4 className="text-lg font-bold text-gray-800">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      
      {/* Close Button */}
      <button 
        className="ml-4 text-gray-500 hover:text-gray-700 focus:outline-none" 
        onClick={() => setVisible(false)} // Manual close
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default NotificationCard;
