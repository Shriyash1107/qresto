import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface QRCode {
  id: string;
  name: string;
  shortId: string;
  type: string;
  destinationUrl?: string;
  isActive: boolean;
  totalScans: number;
  createdAt: string;
}

export default function QRCodes() {
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'single' | 'multi'>('all');

  useEffect(() => {
    fetchQRCodes();
  }, [search, filter]);

  const fetchQRCodes = async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (filter !== 'all') params.type = filter;

      const response = await axios.get('/api/qrcodes', { params });
      setQRCodes(response.data);
    } catch (error) {
      console.error('Failed to fetch QR codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteQRCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this QR code?')) return;

    try {
      await axios.delete(`/api/qrcodes/${id}`);
      fetchQRCodes();
    } catch (error) {
      alert('Failed to delete QR code');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await axios.put(`/api/qrcodes/${id}`, { isActive: !currentStatus });
      fetchQRCodes();
    } catch (error) {
      alert('Failed to update QR code');
    }
  };

  const downloadQR = async (id: string, name: string, format: 'png' | 'svg') => {
    try {
      const response = await axios.get(`/api/qrcodes/${id}/image?format=${format}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name}_qr.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to download QR code');
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QR Codes</h1>
          <p className="text-gray-600 mt-2">Manage all your restaurant QR codes</p>
        </div>
        <Link
          to="/qr-codes/new"
          className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
        >
          ➕ Create QR Code
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search QR codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
          >
            <option value="all">All Types</option>
            <option value="single">Single Redirect</option>
            <option value="multi">Multi-Link</option>
          </select>
        </div>
      </div>

      {/* QR Codes Grid */}
      {qrCodes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrCodes.map((qr) => (
            <div key={qr.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{qr.name}</h3>
                  <p className="text-sm text-gray-500">/{qr.shortId}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    qr.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {qr.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Type</p>
                <p className="text-sm font-medium text-gray-900">
                  {qr.type === 'single' ? '🔗 Single Redirect' : '📋 Multi-Link Page'}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Total Scans</p>
                <p className="text-2xl font-bold text-gray-900">{qr.totalScans}</p>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => downloadQR(qr.id, qr.name, 'png')}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                >
                  PNG
                </button>
                <button
                  onClick={() => downloadQR(qr.id, qr.name, 'svg')}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                >
                  SVG
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/qr-codes/${qr.id}/edit`}
                  className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition text-center"
                >
                  Edit
                </Link>
                <button
                  onClick={() => toggleActive(qr.id, qr.isActive)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                >
                  {qr.isActive ? '⏸️' : '▶️'}
                </button>
                <button
                  onClick={() => deleteQRCode(qr.id)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">📱</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No QR codes yet</h3>
          <p className="text-gray-600 mb-6">Create your first QR code to get started</p>
          <Link
            to="/qr-codes/new"
            className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
          >
            Create QR Code
          </Link>
        </div>
      )}
    </div>
  );
}
