import { useSelector } from 'react-redux';
import DashboardLayout from '../components/common/DashboardLayout.jsx';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);

  const initials = (user?.fullName || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const rows = [
    ['Full name', user?.fullName],
    ['Email', user?.email],
    ['Role', user?.role],
    ['School', user?.school || '—'],
    ['Class', user?.className || '—'],
    ['Status', user?.isActive ? 'Active' : 'Deactivated'],
    ['Account', user?.isApproved || user?.role === 'student' ? 'Approved' : 'Pending approval'],
    ['Member since', user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'],
  ];

  return (
    <DashboardLayout role={user?.role}>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Profile</h1>
      <div className="card max-w-2xl">
        <div className="mb-6 flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
            {initials}
          </span>
          <div>
            <div className="text-lg font-semibold text-gray-900">{user?.fullName}</div>
            <div className="text-sm capitalize text-gray-500">{user?.role}</div>
          </div>
        </div>
        <dl className="divide-y divide-gray-100">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-3">
              <dt className="text-sm text-gray-500">{label}</dt>
              <dd className="text-sm font-medium capitalize text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
