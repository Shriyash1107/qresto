import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

interface MonthlyScans {
  month: string;
  scans: number;
}

interface DeviceBreakdown {
  device_type: string;
  count: number;
}

export default function Analytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyScans, setDailyScans] = useState<DailyScan[]>([]);
  const [monthlyScans, setMonthlyScans] = useState<MonthlyScans[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/analytics/dashboard');
      setStats(response.data.stats);
      setDailyScans(response.data.dailyScans);
      setMonthlyScans(response.data.monthlyScans);
      setDeviceBreakdown(response.data.deviceBreakdown);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#111827', '#6b7280', '#d1d5db', '#f3f4f6'];

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
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Detailed insights into your QR code performance</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600 text-sm font-medium mb-2">Total Scans</p>
          <p className="text-4xl font-bold text-gray-900">{stats?.totalScans || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600 text-sm font-medium mb-2">Scans Today</p>
          <p className="text-4xl font-bold text-gray-900">{stats?.scansToday || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600 text-sm font-medium mb-2">This Month</p>
          <p className="text-4xl font-bold text-gray-900">{stats?.scansThisMonth || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600 text-sm font-medium mb-2">Active QR Codes</p>
          <p className="text-4xl font-bold text-gray-900">{stats?.activeQRCodes || 0}</p>
        </div>
      </div>

      {/* Monthly Scans */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Scans (Last 6 Months)</h2>
        {monthlyScans.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyScans}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="scans" fill="#111827" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No data available
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Scans */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Scans (Last 7 Days)</h2>
          {dailyScans.length > 0 ? (
            <div className="space-y-3">
              {dailyScans.slice(-7).map((day, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{day.date}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-48 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gray-900 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (day.scans / Math.max(...dailyScans.map(d => d.scans))) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">{day.scans}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h2>
          {deviceBreakdown.length > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={deviceBreakdown}
                    dataKey="count"
                    nameKey="device_type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry: any) => {
                      const value = entry as DeviceBreakdown;
                      return `${value.device_type}: ${value.count}`;
                    }}
                  >
                    {deviceBreakdown.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
