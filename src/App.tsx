// App.tsx
import React, { useState } from 'react';
import { MetaDashboard } from './MetaDashboard'; 
import { GoogleDashboard } from './GoogleDashboard';

function App() {
  const [activeDashboard, setActiveDashboard] = useState<'google' | 'meta'>('meta');

  return (
    <div>
      <nav className="bg-gray-800 text-white p-4 flex justify-center items-center space-x-4">
        <span className="font-semibold">Selecionar Dashboard:</span>
        <button 
            onClick={() => setActiveDashboard('meta')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeDashboard === 'meta' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
            Meta Ads
        </button>
        <button 
            onClick={() => setActiveDashboard('google')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeDashboard === 'google' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
            Google Ads
        </button>
      </nav>

      {activeDashboard === 'meta' && <MetaDashboard />}
      {activeDashboard === 'google' && <GoogleDashboard />}
    </div>
  );
}

export default App;