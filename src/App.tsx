import React, { useState, useMemo, useEffect } from 'react';
import { BarChart3, TrendingUp, MousePointer, Eye, DollarSign, Target, Calendar, Activity } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

interface Campaign {
  id: string;
  name: string;
  status: 'Ativada' | 'Pausada';
  type: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avgCpc: number;
  cost: number;
  conversions: number;
  costPerConversion: number;
}

function App() {
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativada' | 'Pausada'>('Todos');
  const [sortBy, setSortBy] = useState<'cost' | 'conversions' | 'clicks'>('cost');
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignsData, setCampaignsData] = useState<Campaign[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
  start: '',
  end: ''
});

  useEffect(() => {
    fetch('https://app.consultoriacs.com.br/api/products')
      .then(res => res.json())
      .then(data => {
        const formatted: Campaign[] = data.map((c: any) => ({
          id: String(c.id),
          name: c.campaign_name,
          status: 'Ativada',
          type: 'Geração de demanda', 
          clicks: Number(c.clicks),
          date: c.date,
          impressions: Number(c.impressions),
          ctr: Number(c.ctr),
          avgCpc: Number(c.clicks) ? Number(c.cost) / Number(c.clicks) : 0,
          cost: Number(c.cost),
          conversions: Number(c.conversions),
          costPerConversion: Number(c.cost_per_conversion) || (Number(c.conversions) ? Number(c.cost)/Number(c.conversions) : 0)
        }));
        setCampaignsData(formatted);
      })
      .catch(err => console.error('Erro ao carregar dados:', err));
  }, []);

const filteredCampaigns = useMemo(() => {
  let filtered = campaignsData;

  // filtro por status
  if (statusFilter !== 'Todos') {
    filtered = filtered.filter(c => c.status === statusFilter);
  }

  // filtro por data
  if (dateRange.start) {
    filtered = filtered.filter(c => new Date(c.date) >= new Date(dateRange.start));
  }
  if (dateRange.end) {
    filtered = filtered.filter(c => new Date(c.date) <= new Date(dateRange.end));
  }

  // filtro por nome da campanha
  if (searchTerm) {
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // ordenação
  return filtered.sort((a, b) => b[sortBy] - a[sortBy]);
}, [statusFilter, sortBy, campaignsData, dateRange, searchTerm]);

  const totals = useMemo(() => {
    return filteredCampaigns.reduce(
      (acc, campaign) => ({
        clicks: acc.clicks + campaign.clicks,
        impressions: acc.impressions + campaign.impressions,
        cost: acc.cost + campaign.cost,
        conversions: acc.conversions + campaign.conversions
      }),
      { clicks: 0, impressions: 0, cost: 0, conversions: 0 }
    );
  }, [filteredCampaigns]);

  const top5 = useMemo(() => {
  return [...filteredCampaigns]
    .filter(c => c.conversions > 0) // só considera campanhas com conversão
    .sort((a, b) => a.costPerConversion - b.costPerConversion)
    .slice(0, 5);
}, [filteredCampaigns]);

const worst5 = useMemo(() => {
  return [...filteredCampaigns]
    .filter(c => c.conversions > 0)
    .sort((a, b) => b.costPerConversion - a.costPerConversion)
    .slice(0, 5);
}, [filteredCampaigns]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('pt-BR').format(value);

  const MetricCard = ({ title, value, subtitle, icon: Icon, gradient, textColor = 'text-white' }: {
    title: string;
    value: string;
    subtitle: string;
    icon: any;
    gradient: string;
    textColor?: string;
  }) => (
    <div className={`${gradient} rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`${textColor} text-sm font-medium opacity-90`}>{title}</p>
          <p className={`${textColor} text-3xl font-bold mt-2`}>{value}</p>
          <p className={`${textColor} text-sm opacity-80 mt-1`}>{subtitle}</p>
        </div>
        <div className={`${textColor} opacity-80`}>
          <Icon size={32} />
        </div>
      </div>
    </div>
  );

  const CampaignBar = ({ campaign, maxValue, metric }: { campaign: Campaign; maxValue: number; metric: string }) => {
    const percentage = ((campaign[metric as keyof Campaign] as number) / maxValue) * 100;
    const getColor = () => {
      switch (metric) {
        case 'cost': return 'bg-gradient-to-r from-orange-500 to-red-500';
        case 'conversions': return 'bg-gradient-to-r from-green-500 to-emerald-500';
        case 'clicks': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
        default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
      }
    };

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 truncate max-w-md">
            {campaign.name}
          </span>
          <span className="text-sm font-bold text-gray-900">
            {metric === 'cost' ? formatCurrency(campaign[metric as keyof Campaign] as number) : 
             formatNumber(campaign[metric as keyof Campaign] as number)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full ${getColor()} transition-all duration-1000 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-md border-b-4 border-gradient-to-r from-green-400 to-blue-500">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img 
              src="https://email-editor-production.s3.amazonaws.com/images/125720/%24ctjhglra79w.png" 
              alt="Canal Solar" 
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard de Campanhas</h1>
              <p className="text-gray-600">Performance das Campanhas - YouTube</p>
            </div>
          </div>
<div className="flex items-center space-x-2 bg-blue-100 px-4 py-2 rounded-lg">
  <Calendar size={20} className="text-blue-600" />
  <input
    type="date"
    value={dateRange.start || ''}
    onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
    className="text-sm font-medium text-blue-800"
  />
  <span>-</span>
  <input
    type="date"
    value={dateRange.end || ''}
    onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
    className="text-sm font-medium text-blue-800"
  />
   <input
    type="text"
    placeholder="Buscar campanha..."
    value={searchTerm}
    onChange={e => setSearchTerm(e.target.value)}
    className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
  />
</div>

        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total de Impressões"
            value={formatNumber(totals.impressions)}
            subtitle="Alcance total das campanhas"
            icon={Eye}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <MetricCard
            title="Total de Cliques"
            value={formatNumber(totals.clicks)}
            subtitle="Engajamento gerado"
            icon={MousePointer}
            gradient="bg-gradient-to-br from-cyan-500 to-cyan-600"
          />
          <MetricCard
            title="Investimento Total"
            value={formatCurrency(totals.cost)}
            subtitle="Custo das campanhas"
            icon={DollarSign}
            gradient="bg-gradient-to-br from-orange-500 to-red-500"
          />
          <MetricCard
            title="Total de Conversões"
            value={formatNumber(totals.conversions)}
            subtitle="Resultados alcançados"
            icon={Target}
            gradient="bg-gradient-to-br from-green-500 to-emerald-600"
          />
        </div>

        {/* Campaigns List */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Activity className="mr-2 text-green-600" size={24} />
              Detalhes das Campanhas
            </h2>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'Todos' | 'Ativada' | 'Pausada')}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="Todos">Todos os Status</option>
              <option value="Ativada">Ativada</option>
              <option value="Pausada">Pausada</option>
            </select>
          </div>

          <div className="overflow-y-auto max-h-96">
            {filteredCampaigns.map(c => (
              <div key={c.id} className="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm truncate max-w-xs">{c.name.replace('[CS] Youtube - ', '')}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    c.status === 'Ativada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>{c.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-600">CTR:</span> <span className="ml-2 font-medium">{c.ctr.toFixed(2)}%</span></div>
                  <div><span className="text-gray-600">CPC:</span> <span className="ml-2 font-medium">{formatCurrency(c.avgCpc)}</span></div>
                  <div><span className="text-gray-600">Conversões:</span> <span className="ml-2 font-medium text-green-600">{formatNumber(c.conversions)}</span></div>
                  <div><span className="text-gray-600">Custo/Conv:</span> <span className="ml-2 font-medium">{formatCurrency(c.costPerConversion)}</span></div>
                  <div><span className="text-gray-600">Custo:</span> <span className="ml-2 font-medium">{formatCurrency(c.cost)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
{/* Nova seção - Top 5 e Piores 5 */}
<div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* Top 5 */}
  <div className="bg-white rounded-xl shadow-lg p-6">
    <h2 className="text-xl font-bold text-green-600 mb-4">Top 5 - Melhor Custo por Conversão</h2>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={top5} layout="vertical" margin={{ left: 40 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={200} />
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Bar dataKey="costPerConversion" fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  </div>

  {/* Piores 5 */}
  <div className="bg-white rounded-xl shadow-lg p-6">
    <h2 className="text-xl font-bold text-red-600 mb-4">Piores 5 - Maior Custo por Conversão</h2>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={worst5} layout="vertical" margin={{ left: 40 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={200} />
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Bar dataKey="costPerConversion" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>
        {/* Summary Stats */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="mr-2 text-purple-600" size={24} />
            Resumo de Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{((totals.clicks / totals.impressions) * 100).toFixed(2)}%</p>
              <p className="text-gray-600 mt-2">CTR Médio Geral</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{formatCurrency(totals.cost / (totals.conversions || 1))}</p>
              <p className="text-gray-600 mt-2">Custo Médio por Conversão</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">{formatCurrency(totals.cost / (totals.clicks || 1))}</p>
              <p className="text-gray-600 mt-2">CPC Médio Geral</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
