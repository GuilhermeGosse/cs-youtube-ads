import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { AggregatedCampaign } from './types';

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');
console.log(genAI)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

function buildPrompt(campaignData: AggregatedCampaign[]): string {
  return `
Você é um especialista em marketing digital analisando dados de performance de campanhas.
Com base nos dados JSON a seguir, que representam o total de cada campanha em um período,
gere uma análise concisa em português do Brasil.

Os dados são:
${JSON.stringify(campaignData, null, 2)}

Sua análise deve seguir estritamente a seguinte estrutura em Markdown:
1. **Visão Geral:** Um parágrafo curto sobre a performance geral, mencionando o investimento total, o número total de conversões e o custo por conversão médio geral.
2. **Campanha Destaque:** Identifique a campanha com o **menor Custo por Conversão (CPA)**. Apresente seu nome, CPA e explique brevemente por que ela é a mais eficiente.
3. **Ponto de Otimização:** Identifique a campanha com o **maior Custo por Conversão (CPA)** ou uma que gastou um valor relevante sem gerar conversões. Sugira que esta campanha precisa de atenção.
4. **Recomendações Acionáveis:** Forneça 2 recomendações curtas e diretas (em formato de lista) para otimizar os resultados, como realocar orçamento da campanha de pior performance para a de melhor, ou revisar os criativos da campanha com CPA alto.
`;
}

export default function AIAnalysisSection({ campaignData }: { campaignData: AggregatedCampaign[] }) {
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateAnalysis = async () => {
    if (campaignData.length === 0) {
      setError('Não há dados no período selecionado para gerar uma análise.');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnalysis('');

    try {
      const prompt = buildPrompt(campaignData);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      setAnalysis(text);
    } catch (err) {
      console.error('Erro da API do Gemini:', err);
      setError('Não foi possível gerar a análise. Verifique a chave de API e a conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Sparkles className="mr-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500" size={24} />
          Análise com IA
        </h2>
        <button
          onClick={generateAnalysis}
          disabled={isLoading}
          className="flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:scale-105 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} />
              Analisando...
            </>
          ) : (
            'Gerar Análise'
          )}
        </button>
      </div>

      {error && <div className="text-red-600 bg-red-100 p-3 rounded-lg text-sm">{error}</div>}

      {analysis && (
        <div className="mt-4 prose prose-sm max-w-none text-gray-800 bg-gray-50 p-4 rounded-lg border">
          <ReactMarkdown>{analysis}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
