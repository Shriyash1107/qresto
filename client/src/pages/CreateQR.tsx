import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface MultiLink {
  label: string;
  url: string;
  icon: string;
}

export default function CreateQR() {
  const [name, setName] = useState('');
  const [type, setType] = useState<'single' | 'multi'>('single');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [multiLinks, setMultiLinks] = useState<MultiLink[]>([{ label: '', url: '', icon: 'link' }]);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);

    try {
      const payload: any = {
        name,
        type,
        fgColor,
        bgColor,
      };

      if (type === 'single') {
        payload.destinationUrl = destinationUrl;
      } else {
        payload.multiLinks = multiLinks.filter(link => link.label && link.url);
      }

      const response = await axios.post('/api/qrcodes', payload);
      navigate(`/qr-codes/${response.data.id}/edit`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create QR Code</h1>
        <p className="text-gray-600 mt-2">Generate a new dynamic QR code for your restaurant</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {/* QR Name */}
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
            placeholder="e.g., Table Menu QR"
          />
        </div>

        {/* QR Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">QR Code Type *</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType('single')}
              className={`p-4 border-2 rounded-lg transition ${
                type === 'single'
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">🔗</div>
              <div className="font-semibold text-gray-900">Single Redirect</div>
              <div className="text-sm text-gray-600 mt-1">Direct link to one URL</div>
            </button>
            <button
              type="button"
              onClick={() => setType('multi')}
              className={`p-4 border-2 rounded-lg transition ${
                type === 'multi'
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">📋</div>
              <div className="font-semibold text-gray-900">Multi-Link Page</div>
              <div className="text-sm text-gray-600 mt-1">Landing page with multiple links</div>
            </button>
          </div>
        </div>

        {/* Single URL */}
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
          </div>
        )}

        {/* Multi Links */}
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

        {/* Colors */}
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

        {/* Submit */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Creating...' : 'Create QR Code'}
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
  );
}
