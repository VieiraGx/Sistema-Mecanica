import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, OrdemServico, Peca } from '../types/database';
import {
  LayoutDashboard, FileText, AlertTriangle, DollarSign, Package,
  Car, ShieldCheck, ChevronRight, TrendingUp, Clock, Calendar
} from 'lucide-react';

interface DashboardViewProps {
  userProfile: Profile;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ userProfile, onNavigateTab }) => {
  const [loading, setLoading] = useState(true);
  const [totalOsAberta, setTotalOsAberta] = useState(0);
  const [totalOsAtrasada, setTotalOsAtrasada] = useState(0);
  const [faturamentoTotal, setFaturamentoTotal] = useState(0);
  const [faturamentoMes, setFaturamentoMes] = useState(0);
  const [recentOs, setRecentOs] = useState<OrdemServico[]>([]);
  const [topPecas, setTopPecas] = useState<{ nome: string; codigo: string; totalQtd: number }[]>([]);

  const isAdmin = userProfile.perfil === 'ADMINISTRADOR';

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: osData, error: osError } = await supabase
        .from('ordens_servico')
        .select('*, clientes(*), veiculos(*)')
        .order('id', { ascending: false });

      if (osError) throw osError;

      const allOs = osData || [];
      const openOs = allOs.filter((o) => o.status !== 'ENTREGUE');
      setTotalOsAberta(openOs.length);

      const now = new Date();
      const overdueOs = openOs.filter((o) => o.previsao_entrega && new Date(o.previsao_entrega) < now);
      setTotalOsAtrasada(overdueOs.length);

      const osIds = allOs.map((o) => o.id);
      let totalRev = 0;
      let monthRev = 0;

      if (osIds.length > 0) {
        const { data: servicos } = await supabase.from('os_servicos').select('*').in('os_id', osIds);
        const { data: pecas } = await supabase.from('os_pecas').select('*, pecas(*)').in('os_id', osIds);

        const pecasCountMap: Record<string, { nome: string; codigo: string; qtd: number }> = {};

        (pecas || []).forEach((p: any) => {
          const key = p.peca_id;
          if (!pecasCountMap[key]) {
            pecasCountMap[key] = {
              nome: p.pecas?.nome || 'Peça',
              codigo: p.pecas?.codigo_interno || 'PEC',
              qtd: 0,
            };
          }
          pecasCountMap[key].qtd += Number(p.quantidade || 0);
        });

        const sortedParts = Object.values(pecasCountMap)
          .sort((a, b) => b.qtd - a.qtd)
          .slice(0, 5)
          .map((item) => ({
            nome: item.nome,
            codigo: item.codigo,
            totalQtd: item.qtd,
          }));

        setTopPecas(sortedParts);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        allOs.forEach((os) => {
          const sumServices = (servicos || [])
            .filter((s: any) => s.os_id === os.id)
            .reduce((acc: number, curr: any) => acc + Number(curr.valor || 0), 0);

          const sumParts = (pecas || [])
            .filter((p: any) => p.os_id === os.id)
            .reduce((acc: number, curr: any) => acc + Number(curr.quantidade || 0) * Number(curr.preco_unitario || 0), 0);

          const osTotal = Number(os.valor_mao_obra || 0) + sumServices + sumParts;
          totalRev += osTotal;

          if (new Date(os.created_at) >= startOfMonth) {
            monthRev += osTotal;
          }
        });
      }

      setFaturamentoTotal(totalRev);
      setFaturamentoMes(monthRev);
      setRecentOs(allOs.slice(0, 5));
    } catch (err: any) {
      console.error('Erro ao carregar dashboard:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (!isAdmin) {
    return (
      <div className="bg-[#125938] text-white p-8 rounded-2xl border-2 border-[#308C50]">
        <h2 className="text-xl font-bold">Painel Operacional do Mecânico</h2>
        <p className="mt-2 text-emerald-200">
          Acesse a aba <strong>Ordens de Serviço</strong> no menu superior para gerenciar os reparos e atualizar o andamento dos veículos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border-2 border-[#06402F] shadow flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#06402F] font-serif flex items-center gap-3">
            <LayoutDashboard className="h-7 w-7 text-[#8C4580]" />
            Dashboard do Administrador
          </h2>
          <p className="text-sm font-semibold text-gray-600">
            Visão geral de produtividade, faturamento e ordens de serviço da Shibuya Motores
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-[#06402F] hover:bg-[#125938] text-white font-bold rounded-xl text-xs flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4 text-[#8C4580]" />
          <span>Atualizar Métricas</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('os')}
          className="bg-[#032326] text-white p-5 rounded-2xl border-2 border-[#308C50] shadow cursor-pointer hover:border-[#8C4580] transition space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-300">OS em Aberto</span>
            <FileText className="h-6 w-6 text-[#8C4580]" />
          </div>
          <div className="text-4xl font-black font-mono">{loading ? '...' : totalOsAberta}</div>
          <p className="text-[11px] text-gray-300 font-semibold flex items-center gap-1">
            <span>Clique para ver a lista</span>
            <ChevronRight className="h-3.5 w-3.5 text-[#8C4580]" />
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('os')}
          className="bg-[#8C4580] text-white p-5 rounded-2xl border-2 border-purple-400 shadow cursor-pointer hover:bg-[#723667] transition space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-200">OS Atrasadas</span>
            <AlertTriangle className="h-6 w-6 text-amber-300" />
          </div>
          <div className="text-4xl font-black font-mono">{loading ? '...' : totalOsAtrasada}</div>
          <p className="text-[11px] text-purple-100 font-semibold flex items-center gap-1">
            <span>Passaram do prazo estipulado</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </p>
        </div>

        <div className="bg-[#125938] text-white p-5 rounded-2xl border-2 border-[#308C50] shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-300">Faturamento Mês</span>
            <DollarSign className="h-6 w-6 text-emerald-300" />
          </div>
          <div className="text-2xl font-black font-mono">
            {loading ? '...' : `R$ ${faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </div>
          <p className="text-[11px] text-emerald-200 font-semibold">Mão de obra + peças consumidas</p>
        </div>

        <div className="bg-[#308C50] text-white p-5 rounded-2xl border-2 border-emerald-400 shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-100">Faturamento Acumulado</span>
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div className="text-2xl font-black font-mono">
            {loading ? '...' : `R$ ${faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </div>
          <p className="text-[11px] text-emerald-100 font-semibold">Total bruto em movimentações</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-[#06402F] shadow p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-gray-200">
            <h3 className="text-lg font-black text-[#06402F] font-serif flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#8C4580]" />
              Ordens de Serviço Recentes
            </h3>
            <button
              onClick={() => onNavigateTab('os')}
              className="text-xs font-extrabold text-[#8C4580] hover:underline flex items-center gap-1"
            >
              <span>Ver Todas</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <p className="p-4 text-center text-xs font-bold text-gray-500">Carregando OS...</p>
          ) : recentOs.length === 0 ? (
            <p className="p-4 text-center text-xs font-bold text-gray-500">Nenhuma OS aberta no sistema.</p>
          ) : (
            <div className="space-y-3">
              {recentOs.map((os) => (
                <div
                  key={os.id}
                  className="bg-[#F7F7E6] p-4 rounded-xl border-2 border-[#125938] flex items-center justify-between hover:border-[#8C4580] transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-[#8C4580]">
                        {os.numero_os}
                      </span>
                      <span className="px-2 py-0.5 bg-[#032326] text-white font-mono font-black rounded text-xs">
                        {os.veiculos?.placa}
                      </span>
                    </div>
                    <p className="font-bold text-[#06402F] text-sm mt-1">
                      {os.veiculos?.modelo} • <span className="text-gray-600">{os.clientes?.nome}</span>
                    </p>
                  </div>

                  <span className="px-3 py-1 bg-[#125938] text-white font-black text-xs rounded-full">
                    {os.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border-2 border-[#06402F] shadow p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-gray-200">
            <h3 className="text-lg font-black text-[#06402F] font-serif flex items-center gap-2">
              <Package className="h-5 w-5 text-[#8C4580]" />
              Peças Mais Utilizadas
            </h3>
          </div>

          {loading ? (
            <p className="p-4 text-center text-xs font-bold text-gray-500">Carregando...</p>
          ) : topPecas.length === 0 ? (
            <p className="p-4 text-center text-xs font-bold text-gray-500">Sem dados de consumo ainda.</p>
          ) : (
            <div className="space-y-3">
              {topPecas.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#F7F7E6] p-3 rounded-xl border border-[#308C50] flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-bold text-[#06402F]">{item.nome}</p>
                    <p className="text-xs text-gray-500 font-mono">{item.codigo}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-[#8C4580] text-white font-mono font-black rounded-lg text-xs">
                    {item.totalQtd} Unid.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
