import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { OrdemServico, StatusOS, Profile, Cliente, Veiculo } from '../types/database';
import {
  FileText, Plus, Search, AlertCircle, X, CheckCircle, Clock, Wrench, ShieldAlert,
  ChevronRight, Calendar, User, DollarSign, Filter, ArrowRightLeft, Layers, ShieldCheck
} from 'lucide-react';

interface OsViewProps {
  userProfile: Profile;
  searchTerm?: string;
  onOpenTimelineModal?: (os: OrdemServico) => void;
  onOpenPartsModal?: (os: OrdemServico) => void;
  onNavigateToVerification?: (veiculo: Veiculo) => void;
}

export const STATUS_MAP: Record<StatusOS, { label: string; bg: string; text: string; step: number }> = {
  RECEBIDO: { label: 'Recebido', bg: 'bg-blue-100 border-blue-300', text: 'text-blue-900', step: 1 },
  EM_DIAGNOSTICO: { label: 'Em Diagnóstico', bg: 'bg-purple-100 border-purple-300', text: 'text-purple-900', step: 2 },
  AGUARDANDO_APROVACAO: { label: 'Aguardando Aprovação', bg: 'bg-amber-100 border-amber-300', text: 'text-amber-900', step: 3 },
  AGUARDANDO_PECAS: { label: 'Aguardando Peça(s)', bg: 'bg-orange-100 border-orange-300', text: 'text-orange-900', step: 4 },
  EM_FUNILARIA: { label: 'Em Funilaria', bg: 'bg-rose-100 border-rose-300', text: 'text-rose-900', step: 5 },
  EM_MECANICA: { label: 'Em Mecânica', bg: 'bg-indigo-100 border-indigo-300', text: 'text-indigo-900', step: 6 },
  TESTE_QUALIDADE: { label: 'Teste / Qualidade', bg: 'bg-teal-100 border-teal-300', text: 'text-teal-900', step: 7 },
  PRONTO_PARA_ENTREGA: { label: 'Pronto para Entrega', bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-900', step: 8 },
  ENTREGUE: { label: 'Entregue', bg: 'bg-gray-200 border-gray-400', text: 'text-gray-900', step: 9 },
};

export const STATUS_LIST: StatusOS[] = [
  'RECEBIDO',
  'EM_DIAGNOSTICO',
  'AGUARDANDO_APROVACAO',
  'AGUARDANDO_PECAS',
  'EM_FUNILARIA',
  'EM_MECANICA',
  'TESTE_QUALIDADE',
  'PRONTO_PARA_ENTREGA',
  'ENTREGUE',
];

export const OsView: React.FC<OsViewProps> = ({
  userProfile,
  searchTerm = '',
  onOpenTimelineModal,
  onOpenPartsModal,
  onNavigateToVerification,
}) => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [mecanicos, setMecanicos] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isNewOsModalOpen, setIsNewOsModalOpen] = useState(false);
  const [clienteId, setClienteId] = useState<number | ''>('');
  const [veiculoId, setVeiculoId] = useState<number | ''>('');
  const [responsavelId, setResponsavelId] = useState<string>('');
  const [previsaoEntrega, setPrevisaoEntrega] = useState<string>('');
  const [tipoMecanica, setTipoMecanica] = useState(true);
  const [tipoFunilaria, setTipoFunilaria] = useState(false);
  const [valorMaoObra, setValorMaoObra] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetOs, setTargetOs] = useState<OrdemServico | null>(null);
  const [selectedNextStatus, setSelectedNextStatus] = useState<StatusOS | ''>('');
  const [statusObservacao, setStatusObservacao] = useState('');

  const isAdmin = userProfile.perfil === 'ADMINISTRADOR';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [osRes, clientesRes, veiculosRes, mecanicosRes] = await Promise.all([
        supabase
          .from('ordens_servico')
          .select('*, clientes(*), veiculos(*), responsavel:responsavel_id(*)')
          .order('id', { ascending: false }),
        supabase.from('clientes').select('*').order('nome', { ascending: true }),
        supabase.from('veiculos').select('*, clientes(*)').order('placa', { ascending: true }),
        supabase.from('profiles').select('*').order('nome', { ascending: true }),
      ]);

      if (osRes.error) throw osRes.error;
      if (clientesRes.error) throw clientesRes.error;
      if (veiculosRes.error) throw veiculosRes.error;
      if (mecanicosRes.error) throw mecanicosRes.error;

      const osList = osRes.data || [];
      const osIds = osList.map((o) => o.id);

      if (osIds.length > 0) {
        const { data: tiposData } = await supabase
          .from('os_tipos_servico')
          .select('*')
          .in('os_id', osIds);

        const { data: servicosData } = await supabase
          .from('os_servicos')
          .select('*')
          .in('os_id', osIds);

        const { data: pecasData } = await supabase
          .from('os_pecas')
          .select('*')
          .in('os_id', osIds);

        const tiposMap: Record<number, string[]> = {};
        (tiposData || []).forEach((item: any) => {
          if (!tiposMap[item.os_id]) tiposMap[item.os_id] = [];
          tiposMap[item.os_id].push(item.tipo);
        });

        const totalsMap: Record<number, number> = {};
        osList.forEach((os) => {
          let sumServices = (servicosData || [])
            .filter((s: any) => s.os_id === os.id)
            .reduce((acc: number, curr: any) => acc + Number(curr.valor || 0), 0);

          let sumParts = (pecasData || [])
            .filter((p: any) => p.os_id === os.id)
            .reduce((acc: number, curr: any) => acc + (Number(curr.quantidade || 0) * Number(curr.preco_unitario || 0)), 0);

          totalsMap[os.id] = Number(os.valor_mao_obra || 0) + sumServices + sumParts;
        });

        osList.forEach((os) => {
          os.tipos_servico = tiposMap[os.id] || ['MECANICA'];
          os.valor_total = totalsMap[os.id] || Number(os.valor_mao_obra || 0);
        });
      }

      setOrdens(osList);
      setClientes(clientesRes.data || []);
      setVeiculos(veiculosRes.data || []);
      setMecanicos(mecanicosRes.data || []);
    } catch (err: any) {
      console.error('Erro ao buscar ordens de serviço:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const availableVehicles = clienteId
    ? veiculos.filter((v) => v.cliente_id === Number(clienteId))
    : veiculos;

  const openNewModal = () => {
    setClienteId(clientes.length > 0 ? clientes[0].id : '');
    setVeiculoId('');
    setResponsavelId(userProfile.id);
    setPrevisaoEntrega('');
    setTipoMecanica(true);
    setTipoFunilaria(false);
    setValorMaoObra(0);
    setErrorMsg(null);
    setIsNewOsModalOpen(true);
  };

  const handleCreateOs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !veiculoId || !responsavelId) {
      setErrorMsg('Preencha os campos obrigatórios: Cliente, Veículo e Mecânico Responsável.');
      return;
    }

    if (!tipoMecanica && !tipoFunilaria) {
      setErrorMsg('Selecione ao menos um tipo de serviço (Mecânica ou Funilaria).');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const year = new Date().getFullYear();
      const numRandom = Math.floor(10000 + Math.random() * 90000);
      const numeroOs = `OS-${year}-${numRandom}`;

      const osPayload = {
        numero_os: numeroOs,
        cliente_id: Number(clienteId),
        veiculo_id: Number(veiculoId),
        responsavel_id: responsavelId,
        criado_por: userProfile.id,
        previsao_entrega: previsaoEntrega ? new Date(previsaoEntrega).toISOString() : null,
        valor_mao_obra: Number(valorMaoObra || 0),
        status: 'RECEBIDO' as StatusOS,
        placa_verificada: false,
      };

      const { data: newOs, error: osError } = await supabase
        .from('ordens_servico')
        .insert(osPayload)
        .select()
        .single();

      if (osError) throw osError;

      const tiposToInsert = [];
      if (tipoMecanica) tiposToInsert.push({ os_id: newOs.id, tipo: 'MECANICA' });
      if (tipoFunilaria) tiposToInsert.push({ os_id: newOs.id, tipo: 'FUNILARIA' });

      await supabase.from('os_tipos_servico').insert(tiposToInsert);

      await supabase.from('os_atualizacoes').insert({
        os_id: newOs.id,
        usuario_id: userProfile.id,
        status_anterior: null,
        status_novo: 'RECEBIDO',
        observacao: 'Ordem de serviço aberta no sistema.',
      });

      setIsNewOsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar ordem de serviço.');
    } finally {
      setSubmitting(false);
    }
  };

  const openChangeStatusModal = (os: OrdemServico) => {
    setTargetOs(os);
    setSelectedNextStatus(os.status);
    setStatusObservacao('');
    setErrorMsg(null);
    setIsStatusModalOpen(true);
  };

  const handleChangeStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOs || !selectedNextStatus) return;

    const requiresVerification = !['RECEBIDO', 'EM_DIAGNOSTICO'].includes(selectedNextStatus);
    if (requiresVerification && !targetOs.placa_verificada) {
      setErrorMsg('ATENÇÃO: Registre a verificação de placa no módulo de Auditoria antes de avançar este status.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const isDelivered = selectedNextStatus === 'ENTREGUE';
      const dataEntrega = isDelivered ? new Date().toISOString() : null;

      const { error: updateError } = await supabase
        .from('ordens_servico')
        .update({
          status: selectedNextStatus,
          data_entrega: dataEntrega,
        })
        .eq('id', targetOs.id);

      if (updateError) throw updateError;

      await supabase.from('os_atualizacoes').insert({
        os_id: targetOs.id,
        usuario_id: userProfile.id,
        status_anterior: targetOs.status,
        status_novo: selectedNextStatus,
        observacao: statusObservacao.trim() || `Status alterado para ${STATUS_MAP[selectedNextStatus].label}`,
      });

      setIsStatusModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao alterar status da OS.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrdens = ordens.filter((os) => {
    const matchesStatus = statusFilter === 'ALL' ? true : os.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      os.numero_os.toLowerCase().includes(term) ||
      os.veiculos?.placa.toLowerCase().includes(term) ||
      os.veiculos?.modelo.toLowerCase().includes(term) ||
      os.clientes?.nome.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border-2 border-[#06402F] shadow">
        <div>
          <h2 className="text-2xl font-black text-[#06402F] font-serif flex items-center gap-3">
            <FileText className="h-7 w-7 text-[#8C4580]" />
            Ordens de Serviço (OS)
          </h2>
          <p className="text-sm font-semibold text-gray-600">
            Acompanhamento em tempo real do fluxo de manutenção & funilaria
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#032326] p-1.5 rounded-xl flex items-center gap-1 border border-[#308C50]">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'kanban' ? 'bg-[#8C4580] text-white' : 'text-emerald-200 hover:text-white'
              }`}
            >
              Quadro Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'list' ? 'bg-[#8C4580] text-white' : 'text-emerald-200 hover:text-white'
              }`}
            >
              Lista Detalhada
            </button>
          </div>

          <button
            onClick={openNewModal}
            className="btn-touch bg-[#8C4580] hover:bg-[#723667] text-white font-bold rounded-xl shadow flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            <span>NOVA ORDEM DE SERVIÇO</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border-2 border-[#125938] flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[#8C4580]" />
          <span className="text-sm font-bold text-[#06402F]">Filtrar por Status:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
              statusFilter === 'ALL'
                ? 'bg-[#06402F] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            TODOS ({ordens.length})
          </button>
          {STATUS_LIST.map((st) => {
            const count = ordens.filter((o) => o.status === st).length;
            const meta = STATUS_MAP[st];
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition ${
                  statusFilter === st
                    ? 'bg-[#8C4580] text-white border-[#8C4580]'
                    : `${meta.bg} ${meta.text} hover:opacity-80`
                }`}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-6">
          <div className="flex gap-4 min-w-max">
            {STATUS_LIST.filter(st => statusFilter === 'ALL' || statusFilter === st).map((st) => {
              const meta = STATUS_MAP[st];
              const columnOsList = filteredOrdens.filter((o) => o.status === st);

              return (
                <div
                  key={st}
                  className="w-80 bg-white/80 rounded-2xl border-2 border-[#06402F] p-4 flex flex-col max-h-[75vh] overflow-y-auto shadow-md"
                >
                  <div className={`p-3 rounded-xl border-2 ${meta.bg} mb-4 flex items-center justify-between`}>
                    <h3 className={`font-extrabold text-sm uppercase ${meta.text}`}>
                      {meta.label}
                    </h3>
                    <span className="px-2 py-0.5 bg-white font-mono font-black text-xs rounded-md shadow-xs text-gray-900">
                      {columnOsList.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {columnOsList.length === 0 ? (
                      <div className="p-6 text-center text-xs font-semibold text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        Nenhuma OS nesta etapa
                      </div>
                    ) : (
                      columnOsList.map((os) => (
                        <div
                          key={os.id}
                          className="bg-white p-4 rounded-xl border-2 border-[#125938] shadow hover:shadow-md transition space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-xs text-[#8C4580]">
                              {os.numero_os}
                            </span>
                            <span className="px-2 py-0.5 bg-[#032326] text-white font-mono font-black rounded text-xs tracking-wider">
                              {os.veiculos?.placa}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-bold text-[#06402F] text-base">{os.veiculos?.modelo}</h4>
                            <p className="text-xs text-gray-600 font-bold flex items-center gap-1 mt-0.5">
                              <User className="h-3.5 w-3.5 text-gray-400" />
                              {os.clientes?.nome}
                            </p>
                          </div>

                          {!os.placa_verificada && (
                            <div className="p-2 bg-amber-50 border border-amber-300 rounded-lg text-[11px] text-amber-900 font-bold flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                                Placa não verificada
                              </span>
                              {isAdmin && onNavigateToVerification && os.veiculos && (
                                <button
                                  onClick={() => onNavigateToVerification(os.veiculos!)}
                                  className="text-[#8C4580] underline font-extrabold"
                                >
                                  Verificar
                                </button>
                              )}
                            </div>
                          )}

                          <div className="text-xs text-gray-700 font-semibold space-y-1 bg-emerald-50/60 p-2 rounded-lg border border-emerald-200">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Mecânico:</span>
                              <span className="font-bold text-[#06402F]">{os.responsavel?.nome}</span>
                            </div>
                            {isAdmin && (
                              <div className="flex items-center justify-between pt-1 border-t border-emerald-200">
                                <span className="text-gray-500">Valor Total:</span>
                                <span className="font-extrabold text-[#8C4580]">
                                  R$ {(os.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 flex items-center justify-between gap-1 border-t border-gray-100">
                            <button
                              onClick={() => openChangeStatusModal(os)}
                              className="px-2.5 py-1.5 bg-[#06402F] hover:bg-[#125938] text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs"
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5 text-[#8C4580]" />
                              Status
                            </button>

                            <div className="flex gap-1">
                              {onOpenTimelineModal && (
                                <button
                                  onClick={() => onOpenTimelineModal(os)}
                                  className="p-1.5 bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-lg text-xs font-bold"
                                  title="Linha do Tempo / Feed"
                                >
                                  Feed
                                </button>
                              )}
                              {onOpenPartsModal && (
                                <button
                                  onClick={() => onOpenPartsModal(os)}
                                  className="p-1.5 bg-emerald-100 text-[#06402F] hover:bg-emerald-200 rounded-lg text-xs font-bold"
                                  title="Vincular Peças"
                                >
                                  Peças
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border-2 border-[#06402F] shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-600 font-bold">Carregando lista de OS...</div>
          ) : filteredOrdens.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-bold">Nenhuma ordem de serviço encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#032326] text-white font-bold text-sm uppercase tracking-wider">
                    <th className="p-4">Nº OS / Data</th>
                    <th className="p-4">Veículo & Cliente</th>
                    <th className="p-4">Status Atual</th>
                    <th className="p-4">Responsável</th>
                    {isAdmin && <th className="p-4 text-right">Valor Total</th>}
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm font-semibold text-gray-800">
                  {filteredOrdens.map((os) => {
                    const statusMeta = STATUS_MAP[os.status];
                    return (
                      <tr key={os.id} className="hover:bg-emerald-50/50 transition">
                        <td className="p-4">
                          <span className="font-mono font-black text-[#8C4580] block text-base">
                            {os.numero_os}
                          </span>
                          <span className="text-xs text-gray-500 font-semibold">
                            {new Date(os.data_entrada).toLocaleDateString('pt-BR')}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-[#032326] text-white font-mono font-black rounded text-xs">
                              {os.veiculos?.placa}
                            </span>
                            <span className="font-bold text-[#06402F]">{os.veiculos?.modelo}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">Cliente: {os.clientes?.nome}</p>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border ${statusMeta.bg} ${statusMeta.text}`}
                          >
                            {statusMeta.label}
                          </span>
                        </td>

                        <td className="p-4 font-bold text-[#06402F]">{os.responsavel?.nome}</td>

                        {isAdmin && (
                          <td className="p-4 text-right font-black text-[#8C4580] text-base">
                            R$ {(os.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        )}

                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openChangeStatusModal(os)}
                              className="px-3 py-1.5 bg-[#06402F] hover:bg-[#125938] text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs"
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5 text-[#8C4580]" />
                              Mudar Status
                            </button>

                            {onOpenTimelineModal && (
                              <button
                                onClick={() => onOpenTimelineModal(os)}
                                className="px-3 py-1.5 bg-purple-100 text-purple-900 hover:bg-purple-200 rounded-lg text-xs font-bold"
                              >
                                Timeline
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {isNewOsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#F7F7E6] rounded-2xl border-4 border-[#06402F] shadow-2xl max-w-xl w-full overflow-hidden">
            <div className="bg-[#06402F] p-5 text-white flex items-center justify-between border-b-4 border-[#8C4580]">
              <h3 className="text-xl font-bold font-serif uppercase flex items-center gap-2">
                <FileText className="h-6 w-6 text-[#8C4580]" />
                Nova Ordem de Serviço
              </h3>
              <button
                onClick={() => setIsNewOsModalOpen(false)}
                className="text-white hover:text-emerald-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateOs} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-100 border-2 border-red-500 rounded-xl text-red-900 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                  Cliente *
                </label>
                <select
                  required
                  value={clienteId}
                  onChange={(e) => {
                    setClienteId(Number(e.target.value));
                    setVeiculoId('');
                  }}
                  className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-[#8C4580]"
                >
                  <option value="">Selecione o cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.cpf ? `(${c.cpf})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                  Veículo do Cliente *
                </label>
                <select
                  required
                  value={veiculoId}
                  onChange={(e) => setVeiculoId(Number(e.target.value))}
                  className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-[#8C4580]"
                >
                  <option value="">Selecione o veículo...</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      [{v.placa}] {v.modelo} - Cor: {v.cor || 'N/I'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                    Mecânico Responsável *
                  </label>
                  <select
                    required
                    value={responsavelId}
                    onChange={(e) => setResponsavelId(e.target.value)}
                    className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-[#8C4580]"
                  >
                    <option value="">Selecione o técnico...</option>
                    {mecanicos.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} ({m.perfil})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                    Previsão de Entrega
                  </label>
                  <input
                    type="date"
                    value={previsaoEntrega}
                    onChange={(e) => setPrevisaoEntrega(e.target.value)}
                    className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-[#8C4580]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-2">
                  Tipos de Serviço Solicitados *
                </label>
                <div className="flex gap-4 bg-white p-3 rounded-xl border-2 border-[#125938]">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-[#06402F]">
                    <input
                      type="checkbox"
                      checked={tipoMecanica}
                      onChange={(e) => setTipoMecanica(e.target.checked)}
                      className="h-5 w-5 accent-[#8C4580] rounded"
                    />
                    <span>Mecânica</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-[#06402F]">
                    <input
                      type="checkbox"
                      checked={tipoFunilaria}
                      onChange={(e) => setTipoFunilaria(e.target.checked)}
                      className="h-5 w-5 accent-[#8C4580] rounded"
                    />
                    <span>Funilaria</span>
                  </label>
                </div>
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                    Valor Inicial Mão de Obra (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorMaoObra}
                    onChange={(e) => setValorMaoObra(Number(e.target.value))}
                    className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-[#8C4580]"
                  />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewOsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-touch bg-[#8C4580] hover:bg-[#723667] text-white font-bold rounded-xl shadow"
                >
                  {submitting ? 'Criando OS...' : 'ABRIR ORDEM DE SERVIÇO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isStatusModalOpen && targetOs && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#F7F7E6] rounded-2xl border-4 border-[#06402F] shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-[#032326] p-5 text-white flex items-center justify-between border-b-4 border-[#8C4580]">
              <div>
                <span className="font-mono font-black text-xs text-[#8C4580] uppercase">
                  {targetOs.numero_os}
                </span>
                <h3 className="text-xl font-black font-serif">
                  Avançar Status do Veículo [{targetOs.veiculos?.placa}]
                </h3>
              </div>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="text-white hover:text-emerald-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleChangeStatus} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-100 border-2 border-red-500 rounded-xl text-red-900 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                  Selecione o Novo Status *
                </label>
                <select
                  required
                  value={selectedNextStatus}
                  onChange={(e) => setSelectedNextStatus(e.target.value as StatusOS)}
                  className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-3 font-extrabold text-[#06402F] focus:outline-none focus:border-[#8C4580]"
                >
                  {STATUS_LIST.map((st) => (
                    <option key={st} value={st}>
                      {STATUS_MAP[st].step}. {STATUS_MAP[st].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                  Observação Técnica para o Histórico (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={statusObservacao}
                  onChange={(e) => setStatusObservacao(e.target.value)}
                  placeholder="ex: Funilaria concluída, transferido para acerto de suspensão na mecânica."
                  className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2 font-semibold focus:outline-none focus:border-[#8C4580]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-touch bg-[#8C4580] hover:bg-[#723667] text-white font-bold rounded-xl shadow"
                >
                  {submitting ? 'Atualizando...' : 'ATUALIZAR STATUS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
