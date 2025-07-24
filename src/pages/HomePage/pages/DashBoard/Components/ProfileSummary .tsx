export const ProfileSummary = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">My Profile Summary</h3>
      
      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
          JA
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 text-lg">Jojo Akwaah Abbiw</h4>
          <p className="text-gray-600 text-sm mb-1">abbiwjojo22@gmail.com</p>
          <p className="text-gray-600 text-sm">+233 - 248547896</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Member Since</p>
          <p className="text-sm text-gray-800">January 15, 2022</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Member Type</p>
          <p className="text-sm text-gray-800">Online family</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm font-medium text-gray-500 mb-3">Ministries & Department</p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Clergy</span>
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">Media Directorate</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Ushering & Protocol</span>
        </div>
      </div>
    </div>
  );
};