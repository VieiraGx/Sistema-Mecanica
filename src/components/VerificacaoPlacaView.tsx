import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { VerificacaoPlaca, Veiculo, Profile } from '../types/database';
import { ShieldCheck, Plus, Search, AlertCircle, X, CheckCircle2, FileText, Calendar } from 'lucide-react';

interface VerificacaoPlacaViewProps {
  userProfile: Profile;
  targetVeiculo?: Veiculo | null;
  onClearTargetVeiculo?: () => void;
}

export const VerificacaoPlacaView: React.FC<VerificacaoPlacaViewProps> = ({
  userProfile,
  targetVeiculo,
  onClearTargetVeiculo,
}) => {
  const [verificacoes, setVerificacoes] = useState<VerificacaoPlaca[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedVeiculoId, setSelectedVeiculoId] = useState<number | ''>('');
  const [observacao, setObservacao] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = userProfile.perfil === 'ADMINISTRADOR';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [verificacoesRes, veiculosRes] = await Promise.all([
        supabase
          .from('verificacoes_placa')
          .select('*, veiculos(*), responsavel:responsavel_id(*)')
          .order('data_hora', { ascending: false }),
        supabase
          .from('veiculos')
          .select('*, clientes(*)')
          .order('placa', { ascending: true }),
      ]);

      if (verificacoesRes.error) throw verificacoesRes.error;
      if (veiculosRes.error) throw veiculosRes.error;

      setVerificacoes(verificacoesRes.data || []);
      setVeiculos(veiculosRes.data || []);
    } catch (err: any) {
      console.error('Erro ao carregar auditoria de placas:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (targetVeiculo) {
      setSelectedVeiculoId(targetVeiculo.id);
      setIsModalOpen(true);
    }
  }, [targetVeiculo]);

  const openNewModal = () => {
    setSelectedVeiculoId(veiculos.length > 0 ? veiculos[0].id : '');
    setObservacao('Consulta policial/SINEPAG ok sem restrições de roubo/furto.');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleRegisterVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVeiculoId) {
      setErrorMsg('Selecione o veículo verificado.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        veiculo_id: Number(selectedVeiculoId),
        responsavel_id: userProfile.id,
        observacao: observacao.trim() || 'Verificação de placa ok.',
        data_hora: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('verificacoes_placa')
        .insert(payload);

      if (error) throw error;

      await supabase
        .from('ordens_servico')
        .update({ placa_verificada: true })
        .eq('veiculo_id', Number(selectedVeiculoId));

      setIsModalOpen(false);
      if (onClearTargetVeiculo) onClearTargetVeiculo();
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar verificação.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVerificacoes = verificacoes.filter((v) => {
    const plate = v.veiculos?.placa || '';
    const model = v.veiculos?.modelo || '';
    const resp = v.responsavel?.nome || '';
    return (
      plate.toLowerCase().includes(search.toLowerCase()) ||
      model.toLowerCase().includes(search.toLowerCase()) ||
      resp.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-8 text-center text-red-900 font-bold">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
        <h3 className="text-xl">Acesso Restrito ao Administrador</h3>
        <p className="text-sm mt-1">
          A auditoria e o registro de verificação legal de placas é exclusivo da administração da oficina.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border-2 border-[#06402F] shadow">
        <div>
          <h2 className="text-2xl font-black text-[#06402F] font-serif flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-[#8C4580]" />
            Auditoria e Verificação de Placas (RF-007)
          </h2>
          <p className="text-sm font-semibold text-gray-600">
            Trilha de segurança jurídica interna para consulta preventiva de veículos
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="btn-touch bg-[#06402F] hover:bg-[#125938] text-white font-bold rounded-xl shadow flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5 text-[#8C4580]" />
          <span>REGISTRAR CONSULTA</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar auditoria por placa, modelo ou responsável..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border-2 border-[#125938] rounded-xl pl-12 pr-4 py-3 text-base font-medium focus:outline-none focus:border-[#8C4580]"
        />
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#06402F] shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-600 font-bold">Carregando auditorias de placa...</div>
        ) : filteredVerificacoes.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-bold">Nenhuma verificação cadastrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#032326] text-white font-bold text-sm uppercase tracking-wider">
                  <th className="p-4">Placa / Veículo</th>
                  <th className="p-4">Data e Hora</th>
                  <th className="p-4">Responsável pela Consulta</th>
                  <th className="p-4">Parecer / Observação</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm font-semibold text-gray-800">
                {filteredVerificacoes.map((v) => (
                  <tr key={v.id} className="hover:bg-emerald-50/50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-[#032326] text-white font-mono font-black rounded text-sm tracking-wider border border-[#308C50]">
                          {v.veiculos?.placa || 'Placa N/I'}
                        </span>
                        <span className="font-bold text-[#06402F]">{v.veiculos?.modelo}</span>
                      </div>
                    </td>

                    <td className="p-4 text-gray-700">
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-md text-xs font-bold">
                        <Calendar className="h-3.5 w-3.5 text-gray-500" />
                        {new Date(v.data_hora).toLocaleString('pt-BR')}
                      </span>
                    </td>

                    <td className="p-4 font-bold text-[#8C4580]">
                      {v.responsavel?.nome || 'Administrador'}
                    </td>

                    <td className="p-4 text-gray-700 max-w-sm">
                      {v.observacao || 'Verificado sem restrições.'}
                    </td>

                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-black border border-emerald-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        VERIFICADO
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#F7F7E6] rounded-2xl border-4 border-[#06402F] shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-[#06402F] p-5 text-white flex items-center justify-between border-b-4 border-[#8C4580]">
              <h3 className="text-xl font-bold font-serif uppercase flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-[#8C4580]" />
                Registrar Consulta de Placa
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  if (onClearTargetVeiculo) onClearTargetVeiculo();
                }}
                className="text-white hover:text-emerald-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleRegisterVerification} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-100 border-2 border-red-500 rounded-xl text-red-900 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                  Selecione o Veículo *
                </label>
                <select
                  required
                  value={selectedVeiculoId}
                  onChange={(e) => setSelectedVeiculoId(Number(e.target.value))}
                  className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-[#8C4580]"
                >
                  <option value="">Selecione o veículo...</option>
                  {veiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      [{v.placa}] {v.modelo} - Cliente: {v.clientes?.nome || 'N/I'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                  Responsável do Registro (Automático)
                </label>
                <input
                  type="text"
                  disabled
                  value={`${userProfile.nome} (ADMINISTRADOR)`}
                  className="w-full bg-gray-100 border-2 border-gray-300 rounded-xl px-4 py-2.5 font-bold text-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                  Parecer / Observação da Consulta *
                </label>
                <textarea
                  rows={3}
                  required
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="ex: Placa checada nos sistemas policiais sem queixas de roubo/furto."
                  className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2 font-semibold focus:outline-none focus:border-[#8C4580]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    if (onClearTargetVeiculo) onClearTargetVeiculo();
                  }}
                  className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-touch bg-[#8C4580] hover:bg-[#723667] text-white font-bold rounded-xl shadow"
                >
                  {submitting ? 'Gravando...' : 'CONFIRMAR VERIFICAÇÃO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
