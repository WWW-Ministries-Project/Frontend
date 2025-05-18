import { useNotificationStore } from "@/pages/HomePage/store/globalComponentsStore";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/solid"; // Use any icon library you prefer
import { useEffect } from "react";

export const NotificationCard = () => {
  const { notification, visible, setVisible } = useNotificationStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(notification.onClose, 300);
    }, 5000); // 5 seconds delay for auto-close

    return () => clearTimeout(timer);
  }, [notification.onClose, setVisible]);

  const backgroundColor =
    notification.type === "error" ? "bg-red-100" : "bg-[#E0F7FA]";
  const borderColor =
    notification.type === "error" ? "border-red-500" : "border-[#7E57C2]";
  const iconColor =
    notification.type === "error" ? "text-red-500" : "text-blue-500";

  return (
    <div
      className={`flex items-start p-4 border rounded-lg shadow-lg z-10 ${backgroundColor} ${borderColor} 
      transform transition-opacity duration-400 ease-in-out 
      ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
      } fixed top-5 right-5`}
    >
      {/* Icon */}
      <InformationCircleIcon className={`h-6 w-6 ${iconColor} mr-3`} />

      {/* Title and Description */}
      <div className="flex-1">
        <h4 className="text-lg font-bold text-gray-800">
          {notification.title}
        </h4>
        <p className="text-sm text-gray-600">{notification.message}</p>
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
