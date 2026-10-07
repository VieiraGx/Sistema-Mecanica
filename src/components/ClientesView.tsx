import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Cliente, Veiculo, Profile } from '../types/database';
import { Users, Plus, Edit2, Search, Car, Phone, MapPin, CreditCard, AlertCircle, X, ChevronRight } from 'lucide-react';

interface ClientesViewProps {
  userProfile: Profile;
  onSelectClientForOs?: (client: Cliente) => void;
  onViewVehiclesForClient?: (clientId: number) => void;
}

export const ClientesView: React.FC<ClientesViewProps> = ({ userProfile, onViewVehiclesForClient }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [endereco, setEndereco] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clienteVeiculos, setClienteVeiculos] = useState<Veiculo[]>([]);

  const isAdmin = userProfile.perfil === 'ADMINISTRADOR';

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setClientes(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar clientes:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const openNewModal = () => {
    setEditingCliente(null);
    setNome('');
    setTelefone('');
    setCpf('');
    setEndereco('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Cliente) => {
    setEditingCliente(c);
    setNome(c.nome);
    setTelefone(c.telefone);
    setCpf(c.cpf || '');
    setEndereco(c.endereco || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !telefone.trim()) {
      setErrorMsg('Nome e telefone são campos obrigatórios.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        nome: nome.trim(),
        telefone: telefone.trim(),
        cpf: cpf.trim() || null,
        endereco: endereco.trim() || null,
      };

      if (editingCliente) {
        const { error } = await supabase
          .from('clientes')
          .update(payload)
          .eq('id', editingCliente.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert(payload);

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchClientes();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const loadClienteDetails = async (c: Cliente) => {
    setSelectedCliente(c);
    try {
      const { data, error } = await supabase
        .from('veiculos')
        .select('*')
        .eq('cliente_id', c.id);

      if (error) throw error;
      setClienteVeiculos(data || []);
    } catch (err) {
      console.error('Erro ao carregar veículos do cliente:', err);
    }
  };

  const filteredClientes = clientes.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone.includes(search) ||
    (c.cpf && c.cpf.includes(search))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border-2 border-[#06402F] shadow">
        <div>
          <h2 className="text-2xl font-black text-[#06402F] font-serif flex items-center gap-3">
            <Users className="h-7 w-7 text-[#8C4580]" />
            Gestão de Clientes
          </h2>
          <p className="text-sm font-semibold text-gray-600">
            Cadastre e acompanhe os proprietários dos veículos atendidos na oficina
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openNewModal}
            className="btn-touch bg-[#8C4580] hover:bg-[#723667] text-white font-bold rounded-xl shadow flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            <span>NOVO CLIENTE</span>
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar cliente por nome, telefone ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border-2 border-[#125938] rounded-xl pl-12 pr-4 py-3 text-base font-medium focus:outline-none focus:border-[#8C4580]"
        />
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#06402F] shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-600 font-bold">Carregando lista de clientes...</div>
        ) : filteredClientes.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-bold">Nenhum cliente encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#032326] text-white font-bold text-sm uppercase tracking-wider">
                  <th className="p-4">Nome</th>
                  {isAdmin && <th className="p-4">Telefone</th>}
                  {isAdmin && <th className="p-4">CPF</th>}
                  {isAdmin && <th className="p-4">Endereço</th>}
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm font-semibold text-gray-800">
                {filteredClientes.map((c) => (
                  <tr key={c.id} className="hover:bg-emerald-50/50 transition">
                    <td className="p-4 font-bold text-[#06402F]">
                      <button
                        onClick={() => loadClienteDetails(c)}
                        className="text-left hover:text-[#8C4580] underline flex items-center gap-2"
                      >
                        {c.nome}
                      </button>
                    </td>

                    {isAdmin && (
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-[#06402F] px-2.5 py-1 rounded-md font-bold">
                          <Phone className="h-4 w-4 text-[#8C4580]" />
                          {c.telefone}
                        </span>
                      </td>
                    )}

                    {isAdmin && (
                      <td className="p-4 text-gray-600">
                        {c.cpf ? (
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                            {c.cpf}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Não informado</span>
                        )}
                      </td>
                    )}

                    {isAdmin && (
                      <td className="p-4 text-gray-600 max-w-xs truncate">
                        {c.endereco ? (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            {c.endereco}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Não informado</span>
                        )}
                      </td>
                    )}

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => loadClienteDetails(c)}
                          className="px-3 py-1.5 bg-[#125938] hover:bg-[#308C50] text-white rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <Car className="h-4 w-4" />
                          Ficha
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                            title="Editar cliente"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
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
              <h3 className="text-xl font-bold font-serif uppercase">
                {editingCliente ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
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
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="ex: Carlos Eduardo Silva"
                  className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-[#8C4580]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="ex: (11) 98765-4321"
                  className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-[#8C4580]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                  CPF (Opcional)
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="ex: 123.456.789-00"
                  className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-[#8C4580]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                  Endereço Residencial (Opcional)
                </label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="ex: Rua das Flores, 120, Bragança Paulista"
                  className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-[#8C4580]"
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
                  {submitting ? 'Salvando...' : 'SALVAR CLIENTE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCliente && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#F7F7E6] rounded-2xl border-4 border-[#06402F] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-[#032326] p-6 text-white border-b-4 border-[#8C4580] flex justify-between items-start">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#8C4580] bg-white px-2 py-0.5 rounded">
                  Ficha do Cliente
                </span>
                <h3 className="text-2xl font-black font-serif mt-1">{selectedCliente.nome}</h3>
              </div>
              <button
                onClick={() => setSelectedCliente(null)}
                className="text-white hover:text-emerald-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border-2 border-[#06402F]">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Telefone</p>
                  <p className="font-bold text-[#06402F]">
                    {isAdmin ? selectedCliente.telefone : '*** Somente Admin ***'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">CPF</p>
                  <p className="font-bold text-[#06402F]">
                    {isAdmin ? (selectedCliente.cpf || 'Não informado') : '*** Somente Admin ***'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-bold text-gray-500 uppercase">Endereço</p>
                  <p className="font-bold text-[#06402F]">
                    {isAdmin ? (selectedCliente.endereco || 'Não informado') : '*** Somente Admin ***'}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-bold text-[#06402F] flex items-center gap-2">
                    <Car className="h-5 w-5 text-[#8C4580]" />
                    Veículos Registrados ({clienteVeiculos.length})
                  </h4>
                </div>

                {clienteVeiculos.length === 0 ? (
                  <p className="text-sm font-semibold text-gray-500 italic bg-gray-100 p-4 rounded-xl">
                    Nenhum veículo vinculado a este cliente ainda.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {clienteVeiculos.map((v) => (
                      <div
                        key={v.id}
                        className="bg-white p-4 rounded-xl border-2 border-[#125938] flex items-center justify-between shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-[#032326] text-white font-mono font-black rounded text-sm tracking-widest border border-[#308C50]">
                              {v.placa}
                            </span>
                            <span className="font-bold text-gray-900">{v.modelo}</span>
                          </div>
                          <p className="text-xs text-gray-600 font-semibold mt-1">
                            Cor: {v.cor || 'N/I'} • Ano: {v.ano || 'N/I'}
                          </p>
                        </div>

                        {onViewVehiclesForClient && (
                          <button
                            onClick={() => {
                              setSelectedCliente(null);
                              onViewVehiclesForClient(selectedCliente.id);
                            }}
                            className="text-xs font-bold text-[#8C4580] hover:underline flex items-center gap-1"
                          >
                            <span>Ver Ficha</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
