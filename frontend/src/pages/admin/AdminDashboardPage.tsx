import React from 'react';

const AdminDashboardPage: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p>This is the admin dashboard. Only admins can see this.</p>
      {/* Add admin-specific content here later */}
    </div>
  );
};

export default AdminDashboardPage; 