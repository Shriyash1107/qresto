import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalQRCodes: number;
  activeQRCodes: number;
  totalScans: number;
  scansToday: number;
  scansThisMonth: number;
}

interface DailyScan {
  date: string;
  scans: number;
}

interface TopQRCode {
  id: string;
  name: string;
  shortId: string;
  scanCount: number;
  isActive: boolean;
}

interface RecentActivity {
  id: string;
  qr_name: string;
  short_id: string;
  scanned_at: string;
  device_type: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyScans, setDailyScans] = useState<DailyScan[]>([]);
  const [topQRCodes, setTopQRCodes] = useState<TopQRCode[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('/api/analytics/dashboard');
      setStats(response.data.stats);
      setDailyScans(response.data.dailyScans);
      setTopQRCodes(response.data.topQRCodes);
      setRecentActivity(response.data.recentActivity);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your QR code performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total QR Codes"
          value={stats?.totalQRCodes || 0}
          icon="📱"
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Active QR Codes"
          value={stats?.activeQRCodes || 0}
          icon="✅"
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="Total Scans"
          value={stats?.totalScans || 0}
          icon="👁️"
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Scans Today"
          value={stats?.scansToday || 0}
          icon="📈"
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Scans Last 30 Days</h2>
        {dailyScans.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyScans}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="scans" stroke="#111827" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No scan data yet. Create a QR code to get started!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top QR Codes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top QR Codes</h2>
            <Link to="/qr-codes" className="text-sm text-gray-600 hover:text-gray-900">
              View all →
            </Link>
          </div>
          {topQRCodes.length > 0 ? (
            <div className="space-y-3">
              {topQRCodes.map((qr) => (
                <div key={qr.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{qr.name}</p>
                    <p className="text-sm text-gray-500">/{qr.shortId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{qr.scanCount}</p>
                    <p className="text-xs text-gray-500">scans</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No QR codes yet.{' '}
              <Link to="/qr-codes/new" className="text-gray-900 font-medium hover:underline">
                Create your first QR code
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl">📱</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{activity.qr_name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.scanned_at).toLocaleString()} • {activity.device_type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">No scans yet</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Link
          to="/qr-codes/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
        >
          <span>➕</span>
          <span>Create New QR Code</span>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <span className={`text-3xl p-3 rounded-lg ${color}`}>{icon}</span>
      </div>
      <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
