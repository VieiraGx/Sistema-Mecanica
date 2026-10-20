import React, { useState } from 'react';
import { SAMPLE_ORDENS } from '../lib/sampleData';
import { OrdemServico } from '../types/database';
import { STATUS_MAP } from './OsView';
import { Search, Car, Wrench, Clock, CheckCircle2, DollarSign, ArrowLeft } from 'lucide-react';

interface PortalClienteViewProps {
  onBackToApp?: () => void;
}

export const PortalClienteView: React.FC<PortalClienteViewProps> = ({ onBackToApp }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [foundOs, setFoundOs] = useState<OrdemServico | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const term = searchTerm.trim().toLowerCase();
    setLoading(true);

    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*, clientes(*), veiculos(*)')
        .order('id', { ascending: false });

      if (!error && data && data.length > 0) {
        const found = data.find(
          (o: any) =>
            o.numero_os.toLowerCase().includes(term) ||
            (o.veiculos?.placa && o.veiculos.placa.toLowerCase().includes(term)) ||
            (o.clientes?.nome && o.clientes.nome.toLowerCase().includes(term))
        );

        if (found) {
          const { data: servs } = await supabase.from('os_servicos').select('*').eq('os_id', found.id);
          const { data: pecs } = await supabase.from('os_pecas').select('*').eq('os_id', found.id);

          const sumServ = (servs || []).reduce((acc: number, s: any) => acc + Number(s.valor || 0), 0);
          const sumPec = (pecs || []).reduce((acc: number, p: any) => acc + (Number(p.quantidade || 0) * Number(p.preco_unitario || 0)), 0);
          const calcTotal = Number(found.valor_mao_obra || 0) + sumServ + sumPec;

          found.valor_total = calcTotal > 0 ? calcTotal : (found.valor_mao_obra || 850);
          setFoundOs(found);
          setSearched(true);
          return;
        }
      }
    } catch (err) {
      console.warn('Consulta ao Supabase no portal falhou, usando dados de demonstracao:', err);
    } finally {
      setLoading(false);
    }

    const fallbackResult = SAMPLE_ORDENS.find(
      (o) =>
        o.numero_os.toLowerCase().includes(term) ||
        (o.veiculos?.placa && o.veiculos.placa.toLowerCase().includes(term)) ||
        (o.clientes?.nome && o.clientes.nome.toLowerCase().includes(term))
    );

    setFoundOs(fallbackResult || null);
    setSearched(true);
  };

  return (
    <div className="min-h-screen bg-[#032326] p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-[#F7F7E6] rounded-2xl shadow-2xl border-4 border-[#06402F] overflow-hidden space-y-6 p-6 sm:p-8">
        <div className="flex items-center justify-between border-b-2 border-[#125938] pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#8C4580] p-2.5 rounded-xl shadow">
              <Car className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#06402F] font-serif uppercase">
                Portal do Cliente
              </h2>
              <p className="text-xs text-gray-600 font-semibold">
                Acompanhe o andamento do seu veículo na Shibuya Motores
              </p>
            </div>
          </div>

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="px-3 py-1.5 bg-[#06402F] text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Área Interna
            </button>
          )}
        </div>

        <form onSubmit={handleSearch} className="space-y-3">
          <label className="block text-xs font-black uppercase text-[#06402F]">
            Digite a Placa do Veículo ou o Nº da OS
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              required
              placeholder="ex: ABC-1234 ou OS-2026-001"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              className="w-full bg-white border-2 border-[#125938] rounded-xl pl-12 pr-4 py-3 font-mono font-black text-lg focus:outline-none focus:border-[#8C4580]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-touch bg-[#8C4580] hover:bg-[#723667] text-white font-black text-lg rounded-xl shadow"
          >
            {loading ? 'CONSULTANDO...' : 'CONSULTAR ANDAMENTO'}
          </button>
        </form>

        {searched && !foundOs && (
          <div className="p-6 bg-amber-50 border-2 border-amber-400 rounded-xl text-center text-amber-900 font-bold">
            Nenhuma Ordem de Serviço encontrada com a placa/número informado. Verifique os dados com a oficina.
          </div>
        )}

        {foundOs && (
          <div className="bg-white p-6 rounded-2xl border-2 border-[#06402F] space-y-5 shadow-lg">
            {(foundOs.status === 'PRONTO_PARA_ENTREGA' || foundOs.status === 'ENTREGUE') && (
              <div className="p-4 bg-emerald-600 text-white font-black rounded-xl text-center text-sm shadow animate-bounce">
                🎉 VEÍCULO PRONTO PARA RETIRADA NA SHIBUYA MOTORES!
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
              <div>
                <span className="font-mono font-black text-xs text-[#8C4580] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {foundOs.numero_os}
                </span>
                <h3 className="text-xl font-bold text-[#06402F] mt-1">
                  {foundOs.veiculos?.modelo}
                </h3>
                <p className="text-xs text-gray-600 font-bold">
                  Cliente: {foundOs.clientes?.nome}
                </p>
              </div>

              <span className="px-3 py-1 bg-[#032326] text-white font-mono font-black text-sm rounded-lg">
                {foundOs.veiculos?.placa}
              </span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">Status Atual do Veículo:</span>
                <span className={`px-3 py-1 rounded-full font-black text-xs border ${STATUS_MAP[foundOs.status].bg} ${STATUS_MAP[foundOs.status].text}`}>
                  {STATUS_MAP[foundOs.status].label}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-gray-700 pt-2 border-t border-emerald-200">
                <span>Previsão de Entrega:</span>
                <span className="font-mono">{foundOs.previsao_entrega ? new Date(foundOs.previsao_entrega).toLocaleDateString('pt-BR') : 'A definir'}</span>
              </div>

              <div className="flex items-center justify-between text-xs font-extrabold text-[#06402F] pt-2 border-t border-emerald-200">
                <span>Valor Total Estimado:</span>
                <span className="font-mono font-black text-[#8C4580] text-base">
                  R$ {(foundOs.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
