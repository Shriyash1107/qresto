import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

interface MultiLink {
  label: string;
  url: string;
  icon: string;
}

export default function EditQR() {
  const { id } = useParams();
  const [name, setName] = useState('');
  const [type, setType] = useState<'single' | 'multi'>('single');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [isActive, setIsActive] = useState(true);
  const [shortId, setShortId] = useState('');
  const [multiLinks, setMultiLinks] = useState<MultiLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const iconOptions = [
    { value: 'menu', label: '📋 Menu' },
    { value: 'zomato', label: '🍕 Zomato' },
    { value: 'swiggy', label: '🛵 Swiggy' },
    { value: 'website', label: '🌐 Website' },
    { value: 'ordering', label: '🛒 Online Order' },
    { value: 'instagram', label: '📸 Instagram' },
    { value: 'facebook', label: '👥 Facebook' },
    { value: 'google', label: '⭐ Google Reviews' },
    { value: 'phone', label: '📞 Phone' },
    { value: 'location', label: '📍 Location' },
    { value: 'link', label: '🔗 Link' },
  ];

  useEffect(() => {
    fetchQRCode();
  }, [id]);

  const fetchQRCode = async () => {
    try {
      const response = await axios.get(`/api/qrcodes/${id}`);
      const qr = response.data;
      setName(qr.name);
      setType(qr.type);
      setDestinationUrl(qr.destinationUrl || '');
      setFgColor(qr.fgColor || '#000000');
      setBgColor(qr.bgColor || '#FFFFFF');
      setIsActive(qr.isActive);
      setShortId(qr.shortId);
      if (qr.multiLinks && qr.multiLinks.length > 0) {
        setMultiLinks(qr.multiLinks);
      }
    } catch (error) {
      setError('Failed to load QR code');
    } finally {
      setLoading(false);
    }
  };

  const addLink = () => {
    setMultiLinks([...multiLinks, { label: '', url: '', icon: 'link' }]);
  };

  const removeLink = (index: number) => {
    setMultiLinks(multiLinks.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: keyof MultiLink, value: string) => {
    const updated = [...multiLinks];
    updated[index][field] = value;
    setMultiLinks(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload: any = {
        name,
        isActive,
        fgColor,
        bgColor,
      };

      if (type === 'single') {
        payload.destinationUrl = destinationUrl;
      } else {
        payload.multiLinks = multiLinks.filter(link => link.label && link.url);
      }

      await axios.put(`/api/qrcodes/${id}`, payload);
      alert('QR code updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update QR code');
    } finally {
      setSaving(false);
    }
  };

  const downloadQR = async (format: 'png' | 'svg') => {
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
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit QR Code</h1>
        <p className="text-gray-600 mt-2">Update your QR code settings and destination</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsActive(true)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                    isActive
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
                  }`}
                >
                  ✅ Active
                </button>
                <button
                  type="button"
                  onClick={() => setIsActive(false)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                    !isActive
                      ? 'bg-gray-200 text-gray-700 border-2 border-gray-400'
                      : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
                  }`}
                >
                  ⏸️ Inactive
                </button>
              </div>
            </div>

            {type === 'single' && (
              <div>
                <label htmlFor="destinationUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Destination URL *
                </label>
                <input
                  id="destinationUrl"
                  type="url"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                  placeholder="https://example.com/menu"
                />
                <p className="mt-2 text-sm text-gray-500">
                  This is the URL customers will be redirected to when scanning the QR code
                </p>
              </div>
            )}

            {type === 'multi' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Links</label>
                  <button
                    type="button"
                    onClick={addLink}
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                  >
                    + Add Link
                  </button>
                </div>
                <div className="space-y-3">
                  {multiLinks.map((link, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <select
                        value={link.icon}
                        onChange={(e) => updateLink(index, 'icon', e.target.value)}
                        className="w-40 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                      >
                        {iconOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateLink(index, 'label', e.target.value)}
                        placeholder="Label"
                        className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateLink(index, 'url', e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                      />
                      {multiLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLink(index)}
                          className="px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="fgColor" className="block text-sm font-medium text-gray-700 mb-2">
                  Foreground Color
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    id="fgColor"
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-16 h-12 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="bgColor" className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    id="bgColor"
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-16 h-12 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/qr-codes')}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Download QR Code</h3>
            <div className="space-y-3">
              <button
                onClick={() => downloadQR('png')}
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
              >
                Download PNG
              </button>
              <button
                onClick={() => downloadQR('svg')}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Download SVG
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">QR URL</h3>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-mono text-gray-900 break-all">
                {window.location.origin}/r/{shortId}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This URL never changes. Update the destination anytime without generating a new QR code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
