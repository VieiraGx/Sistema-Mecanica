import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Veiculo, Cliente, Profile } from '../types/database';
import { Car, Plus, Edit2, Search, ShieldCheck, AlertCircle, X, User, Calendar, Tag } from 'lucide-react';

interface VeiculosViewProps {
  userProfile: Profile;
  filterClientId?: number | null;
  onOpenPlateVerification?: (veiculo: Veiculo) => void;
}

export const VeiculosView: React.FC<VeiculosViewProps> = ({
  userProfile,
  filterClientId,
  onOpenPlateVerification,
}) => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVeiculo, setEditingVeiculo] = useState<Veiculo | null>(null);

  const [clienteId, setClienteId] = useState<number | ''>('');
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [ano, setAno] = useState<number | ''>('');
  const [observacoes, setObservacoes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = userProfile.perfil === 'ADMINISTRADOR';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [veiculosRes, clientesRes] = await Promise.all([
        supabase
          .from('veiculos')
          .select('*, clientes(*)')
          .order('id', { ascending: false }),
        supabase
          .from('clientes')
          .select('*')
          .order('nome', { ascending: true }),
      ]);

      if (veiculosRes.error) throw veiculosRes.error;
      if (clientesRes.error) throw clientesRes.error;

      setVeiculos(veiculosRes.data || []);
      setClientes(clientesRes.data || []);
    } catch (err: any) {
      console.error('Erro ao buscar dados de veículos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openNewModal = () => {
    setEditingVeiculo(null);
    setClienteId(filterClientId || (clientes.length > 0 ? clientes[0].id : ''));
    setPlaca('');
    setModelo('');
    setCor('');
    setAno('');
    setObservacoes('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (v: Veiculo) => {
    setEditingVeiculo(v);
    setClienteId(v.cliente_id);
    setPlaca(v.placa);
    setModelo(v.modelo);
    setCor(v.cor || '');
    setAno(v.ano || '');
    setObservacoes(v.observacoes || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const validatePlate = (plateStr: string) => {
    const cleanPlate = plateStr.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const plateRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
    return plateRegex.test(cleanPlate);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPlate = placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!clienteId) {
      setErrorMsg('Selecione um cliente para vincular o veículo.');
      return;
    }
    if (!cleanPlate || !validatePlate(cleanPlate)) {
      setErrorMsg('Placa inválida. Utilize o formato ABC1234 ou ABC1D23 (Mercosul).');
      return;
    }
    if (!modelo.trim()) {
      setErrorMsg('Informe o modelo do veículo.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        cliente_id: Number(clienteId),
        placa: cleanPlate,
        modelo: modelo.trim(),
        cor: cor.trim() || null,
        ano: ano ? Number(ano) : null,
        observacoes: observacoes.trim() || null,
      };

      if (editingVeiculo) {
        const { error } = await supabase
          .from('veiculos')
          .update(payload)
          .eq('id', editingVeiculo.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('veiculos')
          .insert(payload);

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err.message?.includes('veiculos_placa_key') || err.code === '23505') {
        setErrorMsg('Esta placa já está cadastrada para outro veículo!');
      } else {
        setErrorMsg(err.message || 'Erro ao salvar veículo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVeiculos = veiculos.filter((v) => {
    const matchesFilterClient = filterClientId ? v.cliente_id === filterClientId : true;
    const matchesSearch =
      v.placa.toLowerCase().includes(search.toLowerCase()) ||
      v.modelo.toLowerCase().includes(search.toLowerCase()) ||
      (v.clientes?.nome && v.clientes.nome.toLowerCase().includes(search.toLowerCase()));

    return matchesFilterClient && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border-2 border-[#06402F] shadow">
        <div>
          <h2 className="text-2xl font-black text-[#06402F] font-serif flex items-center gap-3">
            <Car className="h-7 w-7 text-[#8C4580]" />
            Catálogo de Veículos
          </h2>
          <p className="text-sm font-semibold text-gray-600">
            Cadastre e pesquise os carros em manutenção ou funilaria
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="btn-touch bg-[#8C4580] hover:bg-[#723667] text-white font-bold rounded-xl shadow flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          <span>CADASTRAR VEÍCULO</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por placa, modelo do carro ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border-2 border-[#125938] rounded-xl pl-12 pr-4 py-3 text-base font-medium focus:outline-none focus:border-[#8C4580]"
        />
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#06402F] shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-600 font-bold">Carregando catálogo de veículos...</div>
        ) : filteredVeiculos.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-bold">Nenhum veículo cadastrado.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-[#F7F7E6]/50">
            {filteredVeiculos.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-2xl border-2 border-[#125938] shadow-md hover:shadow-lg transition p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-3 border-gray-200">
                    <span className="px-3 py-1 bg-[#032326] text-white font-mono font-black rounded-lg text-lg tracking-widest border-2 border-[#308C50]">
                      {v.placa}
                    </span>
                    <span className="text-xs font-bold uppercase text-[#8C4580] bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                      {v.cor || 'Sem cor'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-[#06402F] font-serif">{v.modelo}</h3>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mt-1">
                      <User className="h-4 w-4 text-[#8C4580]" />
                      <span>{v.clientes?.nome || 'Cliente Não Informado'}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 font-semibold space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-500" />
                      <span>Ano de Fabricação: {v.ano || 'Não informado'}</span>
                    </div>
                    {v.observacoes && (
                      <div className="flex items-start gap-1">
                        <Tag className="h-3.5 w-3.5 text-gray-500 mt-0.5" />
                        <span className="italic">{v.observacoes}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-200 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openEditModal(v)}
                    className="p-2 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 border border-amber-300"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Editar</span>
                  </button>

                  {isAdmin && onOpenPlateVerification && (
                    <button
                      onClick={() => onOpenPlateVerification(v)}
                      className="px-3 py-2 bg-[#06402F] hover:bg-[#125938] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
                    >
                      <ShieldCheck className="h-4 w-4 text-[#8C4580]" />
                      <span>Verificar Placa</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#F7F7E6] rounded-2xl border-4 border-[#06402F] shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-[#06402F] p-5 text-white flex items-center justify-between border-b-4 border-[#8C4580]">
              <h3 className="text-xl font-bold font-serif uppercase">
                {editingVeiculo ? 'Editar Veículo' : 'Cadastrar Veículo'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-emerald-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-100 border-2 border-red-500 rounded-xl text-red-900 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                  Cliente / Proprietário *
                </label>
                <select
                  required
                  value={clienteId}
                  onChange={(e) => setClienteId(Number(e.target.value))}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                    Placa do Veículo *
                  </label>
                  <input
                    type="text"
                    required
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    placeholder="ex: ABC1D23"
                    className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-mono font-black text-center focus:outline-none focus:border-[#8C4580]"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">Mercosul ou Tradicional</p>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="ex: Civic 2.0"
                    className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-[#8C4580]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                    Cor
                  </label>
                  <input
                    type="text"
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    placeholder="ex: Preto Nacre"
                    className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-[#8C4580]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                    Ano de Fabricação
                  </label>
                  <input
                    type="number"
                    min={1950}
                    max={2100}
                    value={ano}
                    onChange={(e) => setAno(e.target.value ? Number(e.target.value) : '')}
                    placeholder="ex: 2021"
                    className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-[#8C4580]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                  Observações Técnicas (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="ex: Detalhes de batida na lataria traseira..."
                  className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2 font-semibold focus:outline-none focus:border-[#8C4580]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-touch bg-[#8C4580] hover:bg-[#723667] text-white font-bold rounded-xl shadow"
                >
                  {submitting ? 'Salvando...' : 'SALVAR VEÍCULO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
