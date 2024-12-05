import React from 'react';

interface AccessRight {
  id: number;
  name: string;
}

const accessRights: AccessRight[] = [
  { id: 1, name: 'Super Admin' },
  { id: 2, name: 'Cashier' },
  { id: 3, name: 'Accountant' },
  { id: 4, name: 'Product Designer' },
  { id: 5, name: 'HR Manager' },
  { id: 6, name: 'Overseer' },
  { id: 7, name: 'Product Owner' },
  { id: 8, name: 'Secretary' },
];

const AccessRightsList: React.FC = () => {
  return (
    <div className="w-full max-w-md mx-auto font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">All access right</h2>
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition"
          onClick={() => alert('Create Access Right Clicked')}
        >
          Create access right
        </button>
      </div>

      {/* List Section */}
      <ul className="border border-gray-300 rounded-md divide-y divide-gray-200">
        {accessRights.map((accessRight) => (
          <li
            key={accessRight.id}
            className="px-4 py-2 hover:bg-gray-100 transition"
          >
            {accessRight.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AccessRightsList;



interface Module {
  id: number;
  name: string;
  accessLevel: 'Can View' | 'Can Manage';
}

const modules: Module[] = [
  { id: 1, name: 'Members', accessLevel: 'Can View' },
  { id: 2, name: 'Events', accessLevel: 'Can View' },
  { id: 3, name: 'My requests', accessLevel: 'Can View' },
  { id: 4, name: 'Staff request', accessLevel: 'Can Manage' },
  { id: 5, name: 'Suppliers', accessLevel: 'Can Manage' },
  { id: 6, name: 'Asset', accessLevel: 'Can Manage' },
  { id: 7, name: 'Users', accessLevel: 'Can Manage' },
  { id: 8, name: 'Department', accessLevel: 'Can Manage' },
  { id: 9, name: 'Positions', accessLevel: 'Can Manage' },
  { id: 10, name: 'Access rights', accessLevel: 'Can Manage' },
];

export const AccessLevelManagement: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white border border-gray-300 rounded-lg shadow">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Super admin</h2>
        <div className="space-x-2">
          <button
            className="text-gray-600 bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition"
            onClick={() => alert('Close clicked')}
          >
            Close
          </button>
          <button
            className="text-white bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition"
            onClick={() => alert('Edit clicked')}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Table Section */}
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left text-gray-700">
            <th className="px-4 py-2 border-b">Modules / Sub-modules</th>
            <th className="px-4 py-2 border-b">Access Level Management</th>
          </tr>
        </thead>
        <tbody>
          {modules.map((module) => (
            <tr key={module.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border-b">{module.name}</td>
              <td className="px-4 py-2 border-b">
                <span
                  className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded-md ${
                    module.accessLevel === 'Can View'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-green-100 text-green-600'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mr-2 ${
                      module.accessLevel === 'Can View'
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                    }`}
                  ></span>
                  {module.accessLevel}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


interface TableListProps<T> {
  title: string; // Title of the list (e.g., "Super admin" or "All access right")
  columns: string[]; // Column headers
  data: T[]; // Array of data items
  renderRow: (item: T) => React.ReactNode; // Function to render each row
  actions?: { label: string; onClick: () => void; className?: string }[]; // Optional actions (buttons)
}

export const TableList = <T,>({ title, columns, data, renderRow, actions }: TableListProps<T>) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white rounded-lg shadow">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {actions && (
          <div className="space-x-2">
            {actions.map((action, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-md transition ${
                  action.className || 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table Section */}
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left text-gray-700">
            {columns.map((column, index) => (
              <th key={index} className="px-4 py-2">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="even:bg-white odd:bg-[#F2F4F7]">
              {renderRow(item)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

;
