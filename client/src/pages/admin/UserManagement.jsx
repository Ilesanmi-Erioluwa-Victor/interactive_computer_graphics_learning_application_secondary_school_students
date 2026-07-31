import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout.jsx';
import Loader from '../../components/common/Loader.jsx';
import { userApi } from '../../api/users.js';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [filters, setFilters] = useState({ role: '', status: '', search: '', approval: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load(1);
  }, [filters]);

  const load = async (page) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;
      if (filters.approval) params.approval = filters.approval;
      if (filters.search) params.search = filters.search;
      const { data } = await userApi.getUsers(params);
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await userApi.approveTeacher(id);
      toast.success('Teacher approved');
      load(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve teacher');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await userApi.updateUser(user._id, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      load(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleRoleChange = async (user, role) => {
    try {
      await userApi.updateUser(user._id, { role });
      toast.success('Role updated');
      load(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500">Manage users, roles, and teacher approvals.</p>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input
            className="input-field"
            placeholder="Search name / email / class..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <select
            className="input-field"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="">All roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
          </select>
          <select
            className="input-field"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </select>
          <select
            className="input-field"
            value={filters.approval}
            onChange={(e) => setFilters({ ...filters, approval: e.target.value })}
          >
            <option value="">All approvals</option>
            <option value="pending">Pending teachers</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <Loader fullScreen={false} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="py-2 pr-3 font-medium">User</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Approval</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="py-3 pr-3">
                      <div className="font-medium text-gray-800">{user.fullName}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                      {user.className && <div className="text-xs text-gray-400">{user.className}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <select
                        className="rounded border border-gray-200 bg-white px-2 py-1 text-xs font-medium"
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value)}
                        disabled={user.role === 'admin'}
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {user.role === 'teacher' && !user.isApproved ? (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                          Pending
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                          {user.role === 'student' ? 'Auto' : 'Approved'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {user.role === 'teacher' && !user.isApproved && (
                          <button
                            type="button"
                            className="rounded bg-primary-600 px-2 py-1 text-xs font-semibold text-white hover:bg-primary-700"
                            onClick={() => handleApprove(user._id)}
                          >
                            Approve
                          </button>
                        )}
                        <button
                          type="button"
                          className={`rounded px-2 py-1 text-xs font-semibold ${
                            user.isActive
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-500">No users match your filters.</p>
            )}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.pages} · {pagination.total} users
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => load(pagination.page - 1)}
              >
                Prev
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={pagination.page >= pagination.pages}
                onClick={() => load(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
