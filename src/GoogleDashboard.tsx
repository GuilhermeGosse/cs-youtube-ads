import React, { useState, useMemo, useEffect } from 'react';
import { BarChart3, TrendingUp, MousePointer, Eye, DollarSign, Target, Calendar, Activity, ListChecks, Layers, List } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import AIAnalysisSection from './AnaliseIA';
import { AggregatedCampaign, DailyCampaignEntry } from './types';


export function GoogleDashboard() {
  const [sortBy, setSortBy] = useState<'cost' | 'conversions' | 'clicks' | 'impressions'>('cost');
  const [searchTerm, setSearchTerm] = useState('');
  const [rawCampaignsData, setRawCampaignsData] = useState<DailyCampaignEntry[]>([]);
  const [detailsView, setDetailsView] = useState<'total' | 'daily'>('total');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  useEffect(() => {
    fetch('https://app.consultoriacs.com.br/api/google_ads')
      .then(res => res.json())
      .then(data => {
        const formatted: DailyCampaignEntry[] = data.map((c: any) => ({
          id: String(c.id),
          name: c.campaign_name,
          type: 'Geração de demanda',
          clicks: Number(c.clicks) || 0,
          date: c.date,
          impressions: Number(c.impressions) || 0,
          ctr: Number(c.ctr) || 0,
          cost: Number(c.cost) || 0,
          conversions: Number(c.conversions) || 0,
          avgCpc: (Number(c.clicks) || 0) > 0 ? (Number(c.cost) || 0) / (Number(c.clicks) || 0) : 0,
          costPerConversion: (Number(c.conversions) || 0) > 0 ? (Number(c.cost) || 0) / (Number(c.conversions) || 0) : 0,
        }));
        setRawCampaignsData(formatted);
      })
      .catch(err => console.error('Erro ao carregar dados:', err));
  }, []);
  
  const filteredDailyCampaigns = useMemo(() => {
    let filtered = rawCampaignsData;
    if (dateRange.start) { filtered = filtered.filter(c => new Date(c.date) >= new Date(dateRange.start)); }
    if (dateRange.end) { const endDate = new Date(dateRange.end); endDate.setHours(23, 59, 59, 999); filtered = filtered.filter(c => new Date(c.date) <= endDate); }
    if (searchTerm) { filtered = filtered.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())); }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [rawCampaignsData, dateRange, searchTerm]);

  const aggregatedCampaigns = useMemo(() => {
    const aggregatedMap = new Map<string, AggregatedCampaign>();
    filteredDailyCampaigns.forEach(campaign => {
      const existing = aggregatedMap.get(campaign.name);
      if (existing) {
        existing.clicks += campaign.clicks;
        existing.impressions += campaign.impressions;
        existing.cost += campaign.cost;
        existing.conversions += campaign.conversions;
      } else {
        aggregatedMap.set(campaign.name, {
          id: campaign.name, name: campaign.name, type: campaign.type,
          clicks: campaign.clicks, impressions: campaign.impressions, cost: campaign.cost, conversions: campaign.conversions,
          ctr: 0, avgCpc: 0, costPerConversion: 0,
        });
      }
    });
    let aggregatedList: AggregatedCampaign[] = Array.from(aggregatedMap.values()).map(agg => ({
      ...agg,
      ctr: agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0,
      avgCpc: agg.clicks > 0 ? agg.cost / agg.clicks : 0,
      costPerConversion: agg.conversions > 0 ? agg.cost / agg.conversions : 0,
    }));
    return aggregatedList.sort((a, b) => b[sortBy] - a[sortBy]);
  }, [filteredDailyCampaigns, sortBy]);

  const totals = useMemo(() => aggregatedCampaigns.reduce((acc, c) => ({ clicks: acc.clicks + c.clicks, impressions: acc.impressions + c.impressions, cost: acc.cost + c.cost, conversions: acc.conversions + c.conversions }), { clicks: 0, impressions: 0, cost: 0, conversions: 0 }), [aggregatedCampaigns]);
  const top5 = useMemo(() => [...aggregatedCampaigns].filter(c => c.conversions > 0).sort((a, b) => a.costPerConversion - b.costPerConversion).slice(0, 5), [aggregatedCampaigns]);
  const worst5 = useMemo(() => [...aggregatedCampaigns].filter(c => c.conversions > 0).sort((a, b) => b.costPerConversion - a.costPerConversion).slice(0, 5), [aggregatedCampaigns]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

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

  const CampaignBar = ({ campaign, maxValue, metric }: { campaign: AggregatedCampaign; maxValue: number; metric: string }) => {
    const value = campaign[metric as keyof AggregatedCampaign] as number;
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    const getColor = () => {
      switch (metric) {
        case 'cost': return 'bg-gradient-to-r from-orange-500 to-red-500';
        case 'conversions': return 'bg-gradient-to-r from-green-500 to-emerald-500';
        case 'clicks': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
        case 'impressions': return 'bg-gradient-to-r from-purple-500 to-indigo-500';
        default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
      }
    };
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 truncate max-w-md">{campaign.name.replace('[CS] Youtube - ', '')}</span>
          <span className="text-sm font-bold text-gray-900">{metric === 'cost' ? formatCurrency(value) : formatNumber(value)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className={`h-3 rounded-full ${getColor()} transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }}/>
        </div>
      </div>
    );
  };
  
  const maxValues = useMemo(() => ({
    cost: Math.max(...aggregatedCampaigns.map(c => c.cost), 0),
    conversions: Math.max(...aggregatedCampaigns.map(c => c.conversions), 0),
    clicks: Math.max(...aggregatedCampaigns.map(c => c.clicks), 0),
    impressions: Math.max(...aggregatedCampaigns.map(c => c.impressions), 0),
  }), [aggregatedCampaigns]);

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img 
              src="https://email-editor-production.s3.amazonaws.com/images/125720/%24ctjhglra79w.png" 
              alt="Canal Solar" 
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Google Ads</h1>
              <p className="text-gray-600">Performance das Campanhas</p>
            </div>
          </div>
        
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
           <MetricCard title="Total de Impressões" value={formatNumber(totals.impressions)} subtitle="Alcance total das campanhas" icon={Eye} gradient="bg-gradient-to-br from-purple-500 to-indigo-600" />
           <MetricCard title="Total de Cliques" value={formatNumber(totals.clicks)} subtitle="Engajamento gerado" icon={MousePointer} gradient="bg-gradient-to-br from-cyan-500 to-cyan-600" />
           <MetricCard title="Investimento Total" value={formatCurrency(totals.cost)} subtitle="Custo das campanhas" icon={DollarSign} gradient="bg-gradient-to-br from-orange-500 to-red-500" />
           <MetricCard title="Total de Conversões" value={formatNumber(totals.conversions)} subtitle="Resultados alcançados" icon={Target} gradient="bg-gradient-to-br from-green-500 to-emerald-600" />
        </div>
        <div className="flex items-center space-x-2 bg-gray-200 px-4 py-2 rounded-lg">
            <input
              type="date"
              value={dateRange.start || ''}
              onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="text-sm font-medium text-gray-800 bg-transparent outline-none"
            />
            <span>-</span>
            <input
              type="date"
              value={dateRange.end || ''}
              onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="text-sm font-medium text-gray-800 bg-transparent outline-none"
            />
            <input
              type="text"
              placeholder="Buscar campanha..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center"><ListChecks className="mr-2 text-blue-600" size={24} />Resumo por Campanha (Total no Período)</h2>
                <div className="flex items-center space-x-4">
                     <span className="text-sm font-medium text-gray-600">Ordenar por:</span>
                     <select 
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     >
                        <option value="cost">Custo</option>
                        <option value="conversions">Conversões</option>
                        <option value="clicks">Cliques</option>
                        <option value="impressions">Impressões</option>
                     </select>
                </div>
            </div>
             <div className="overflow-y-auto max-h-96 pr-2">
                {aggregatedCampaigns.map(c => (<CampaignBar key={c.id} campaign={c} maxValue={maxValues[sortBy]} metric={sortBy} />))}
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    {detailsView === 'total' ? <Layers className="mr-2 text-green-600" /> : <List className="mr-2 text-green-600" />}
                    {detailsView === 'total' ? 'Detalhes por Campanha (Total)' : 'Detalhes Diários das Campanhas'}
                </h2>
                <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
                    <button onClick={() => setDetailsView('total')} className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${detailsView === 'total' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-gray-300'}`}>
                        Total
                    </button>
                    <button onClick={() => setDetailsView('daily')} className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${detailsView === 'daily' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-gray-300'}`}>
                        Diário
                    </button>
                </div>
            </div>

            <div className="overflow-y-auto max-h-96 pr-2">
                {detailsView === 'total' && (
                    <div>
                        {aggregatedCampaigns.map(c => (
                            <div key={c.id} className="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-all duration-200">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900 text-sm truncate max-w-md">{c.name.replace('[CS] Youtube - ', '')}</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    <div><span className="text-gray-600">CTR Médio:</span> <span className="ml-2 font-medium">{c.ctr.toFixed(2)}%</span></div>
                                    <div><span className="text-gray-600">CPC Médio:</span> <span className="ml-2 font-medium">{formatCurrency(c.avgCpc)}</span></div>
                                    <div><span className="text-gray-600">Custo/Conv:</span> <span className="ml-2 font-medium">{formatCurrency(c.costPerConversion)}</span></div>
                                    <div><span className="text-gray-600">Total Impressões:</span> <span className="ml-2 font-medium">{formatNumber(c.impressions)}</span></div>
                                    <div><span className="text-gray-600">Total Conversões:</span> <span className="ml-2 font-medium text-green-600">{formatNumber(c.conversions)}</span></div>
                                    <div><span className="text-gray-600">Total Custo:</span> <span className="ml-2 font-medium">{formatCurrency(c.cost)}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {detailsView === 'daily' && (
                    <div>
                        {filteredDailyCampaigns.map(c => (
                            <div key={c.id} className="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900 text-sm truncate max-w-xs">{c.name.replace('[CS] Youtube - ', '')}</h3>
                                    <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">{new Date(c.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    <div><span className="text-gray-600">Impressões:</span> <span className="ml-2 font-medium">{formatNumber(c.impressions)}</span></div>
                                    <div><span className="text-gray-600">Cliques:</span> <span className="ml-2 font-medium">{formatNumber(c.clicks)}</span></div>
                                    <div><span className="text-gray-600">Conversões:</span> <span className="ml-2 font-medium text-green-600">{formatNumber(c.conversions)}</span></div>
                                    <div><span className="text-gray-600">Custo:</span> <span className="ml-2 font-medium">{formatCurrency(c.cost)}</span></div>
                                    <div><span className="text-gray-600">CPC Médio:</span> <span className="ml-2 font-medium">{formatCurrency(c.avgCpc)}</span></div>
                                    <div><span className="text-gray-600">Custo/Conv:</span> <span className="ml-2 font-medium">{formatCurrency(c.costPerConversion)}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-green-600 mb-4">Top 5 - Melhor Custo por Conversão</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top5} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis dataKey="name" type="category" width={200} tickFormatter={(value) => value.replace('[CS] Youtube - ', '')} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="costPerConversion" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">Piores 5 - Maior Custo por Conversão</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={worst5} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis dataKey="name" type="category" width={200} tickFormatter={(value) => value.replace('[CS] Youtube - ', '')} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="costPerConversion" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
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
        <footer className="mt-12 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Canal Solar - Todos os direitos reservados.
        </footer>
      </div>
    </div>
  );
}

