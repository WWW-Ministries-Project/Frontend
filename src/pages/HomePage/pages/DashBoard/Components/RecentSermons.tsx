import { BookOpenIcon } from "@heroicons/react/24/outline";

export const RecentSermons = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <BookOpenIcon className="text-primary" height={24}/>
        <h3 className="text-xl font-semibold text-gray-800">Recent Sermons</h3>
      </div>
      
      <div className="text-center py-12">
        <div className="flex justify-center">
            <BookOpenIcon className="text-gray-600" height={24}/>
        </div>
        <h4 className="text-lg font-medium text-gray-600 mb-2">No sermons posted yet</h4>
        <p className="text-gray-500">There are currently no sermons posted. Please check back later</p>
      </div>
    </div>
  );
};