import React from 'react';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  MapPinIcon, 
  UserIcon, 
  DocumentTextIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

// Type interfaces
interface Event {
  id: string | number;
  name: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  location?: string;
  organizer?: string;
  category?: string;
  [key: string]: unknown;
}

interface EventDetailsModalProps {
  event: Event | null;
  onClose: () => void;
  modalRef: React.RefObject<HTMLDivElement>;
  onDelete?: (eventId: string | number) => void;
  onEdit?: (event: Event) => void;
  onShowOptions?: (eventId: string | number) => void;
  showOptions?: boolean;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ 
  event, 
  onClose, 
  modalRef, 
  onDelete, 
  onEdit, 
  onShowOptions, 
  showOptions 
}) => {
  if (!event) return null;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getEventDuration = (): string => {
    if (!event.start_time || !event.end_time) return '';
    
    const startTime = new Date(`2000-01-01T${event.start_time}`);
    const endTime = new Date(`2000-01-01T${event.end_time}`);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // Duration in minutes
    
    if (duration < 60) {
      return `${duration} minutes`;
    } else if (duration === 60) {
      return '1 hour';
    } else {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
    }
  };

  const handleEdit = (): void => {
    if (onEdit) {
      onEdit(event);
    }
    onClose();
  };

  const handleDelete = (): void => {
    if (onDelete && window.confirm('Are you sure you want to delete this event?')) {
      onDelete(event.id);
    }
    onClose();
  };

  const handleShowOptions = (): void => {
    if (onShowOptions) {
      onShowOptions(event.id);
    }
  };

  return (
    <div className=" overflow-y-auto">
      {/* <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center"> */}
        {/* <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} /> */}
        
        <div
          className="relative bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all max-w-md w-full"
          ref={modalRef}
        >
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-primary to-primary px-6 py-8 relative">
            {/* <button
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors rounded-full p-1 hover:bg-white hover:bg-opacity-20"
              onClick={onClose}
              type="button"
            >
              <XMarkIcon className="w-5 h-5" />
            </button> */}
            
            <div className="text-white">
              <h1 className="text-xl font-bold mb-2 pr-8">{event.name}</h1>
              <div className="flex items-center text-white text-opacity-90">
                <CalendarDaysIcon className="w-4 h-4 mr-2" />
                <span className="text-sm">{formatDate(event.start_date)}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Time Information */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Time</h3>
                <div className="text-sm text-gray-600">
                  {event.start_time && event.end_time ? (
                    <>
                      <div>{formatTime(event.start_time)} - {formatTime(event.end_time)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Duration: {getEventDuration()}
                      </div>
                    </>
                  ) : (
                    <div>All day</div>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MapPinIcon className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">Location</h3>
                  <p className="text-sm text-gray-600">{event.location}</p>
                </div>
              </div>
            )}

            {/* Organizer/Creator */}
            {event.organizer && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">Organizer</h3>
                  <p className="text-sm text-gray-600">{event.organizer}</p>
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <DocumentTextIcon className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">Description</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
                </div>
              </div>
            )}

            {/* Event Type/Category */}
            {event.category && (
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {event.category}
                </span>
              </div>
            )}
          </div>

          {/* Status Indicator */}
          <div className="absolute top-4 left-4">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
          </div>
        </div>
      {/* </div> */}
    </div>
  );
};

export default EventDetailsModal;