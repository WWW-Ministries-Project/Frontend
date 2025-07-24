import { ClockIcon } from "@heroicons/react/24/outline";

export const MyAppointments = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">My Appointments</h3>
      
      <div className="text-center py-8">
        <div className="flex justify-center">
            <ClockIcon className="text-gray-600" height={24}/>
        </div>
        <h4 className="font-medium text-gray-600 mb-2">No appointment yet</h4>
        <p className="text-gray-500 text-sm">Check back soon — any appointment will appear here.</p>
      </div>
    </div>
  );
};