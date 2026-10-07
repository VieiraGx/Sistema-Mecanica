import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Peca, Profile, OrdemServico } from '../types/database';
import { Package, Plus, Search, Edit2, AlertCircle, X, DollarSign, TrendingUp, ArrowDownRight, ArrowUpRight, Layers } from 'lucide-react';

interface PecasViewProps {
  userProfile: Profile;
  targetOsForBinding?: OrdemServico | null;
  onCloseBindingModal?: () => void;
}

export const PecasView: React.FC<PecasViewProps> = ({
  userProfile,
  targetOsForBinding,
  onCloseBindingModal,
}) => {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeca, setEditingPeca] = useState<Peca | null>(null);
  const [codigoInterno, setCodigoInterno] = useState('');
  const [nome, setNome] = useState('');
  const [modeloCompativel, setModeloCompativel] = useState('');
  const [precoMin, setPrecoMin] = useState<number | ''>('');
  const [precoMedio, setPrecoMedio] = useState<number | ''>('');
  const [precoMax, setPrecoMax] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedPeca, setSelectedPeca] = useState<Peca | null>(null);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [fornecedor, setFornecedor] = useState('');

  const [osPecas, setOsPecas] = useState<any[]>([]);
  const [selectedPecaToBindId, setSelectedPecaToBindId] = useState<number | ''>('');
  const [bindQuantidade, setBindQuantidade] = useState<number>(1);
  const [bindPrecoUnitario, setBindPrecoUnitario] = useState<number>(0);
  const [bindFornecedor, setBindFornecedor] = useState('');

  const isAdmin = userProfile.perfil === 'ADMINISTRADOR';

  const fetchPecas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pecas')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;

      const { data: movData } = await supabase.from('estoque_movimentacoes').select('*');

      const stockMap: Record<number, number> = {};
      (movData || []).forEach((m: any) => {
        if (!stockMap[m.peca_id]) stockMap[m.peca_id] = 0;
        if (m.tipo === 'ENTRADA' || m.tipo === 'COMPRA') {
          stockMap[m.peca_id] += Number(m.quantidade);
        } else {
          stockMap[m.peca_id] -= Number(m.quantidade);
        }
      });

      const pecasWithStock = (data || []).map((p) => ({
        ...p,
        saldo_estoque: stockMap[p.id] || 0,
      }));

      setPecas(pecasWithStock);
    } catch (err: any) {
      console.error('Erro ao buscar catálogo de peças:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOsPecas = async (osId: number) => {
    try {
      const { data, error } = await supabase
        .from('os_pecas')
        .select('*, pecas(*)')
        .eq('os_id', osId);

      if (error) throw error;
      setOsPecas(data || []);
    } catch (err) {
      console.error('Erro ao buscar peças vinculadas à OS:', err);
    }
  };

  useEffect(() => {
    fetchPecas();
  }, []);

  useEffect(() => {
    if (targetOsForBinding) {
      fetchOsPecas(targetOsForBinding.id);
    }
  }, [targetOsForBinding]);

  const openNewModal = () => {
    setEditingPeca(null);
    setCodigoInterno(`PEC-${Math.floor(1000 + Math.random() * 9000)}`);
    setNome('');
    setModeloCompativel('');
    setPrecoMin('');
    setPrecoMedio('');
    setPrecoMax('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Peca) => {
    setEditingPeca(p);
    setCodigoInterno(p.codigo_interno);
    setNome(p.nome);
    setModeloCompativel(p.modelo_compativel || '');
    setPrecoMin(p.preco_min || '');
    setPrecoMedio(p.preco_medio || '');
    setPrecoMax(p.preco_max || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSavePeca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !codigoInterno.trim()) {
      setErrorMsg('Código interno e nome da peça são obrigatórios.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        codigo_interno: codigoInterno.trim(),
        nome: nome.trim(),
        modelo_compativel: modeloCompativel.trim() || null,
        preco_min: precoMin !== '' ? Number(precoMin) : null,
        preco_medio: precoMedio !== '' ? Number(precoMedio) : null,
        preco_max: precoMax !== '' ? Number(precoMax) : null,
        data_ultima_atualizacao: new Date().toISOString(),
      };

      if (editingPeca) {
        const { error } = await supabase.from('pecas').update(payload).eq('id', editingPeca.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pecas').insert(payload);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchPecas();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar peça.');
    } finally {
      setSubmitting(false);
    }
  };

  const openStockModal = (p: Peca) => {
    setSelectedPeca(p);
    setTipoMovimentacao('ENTRADA');
    setQuantidade(1);
    setFornecedor('');
    setErrorMsg(null);
    setIsStockModalOpen(true);
  };

  const handleStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeca || quantidade <= 0) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        peca_id: selectedPeca.id,
        tipo: tipoMovimentacao,
        quantidade: Number(quantidade),
        fornecedor: fornecedor.trim() || null,
        usuario_id: userProfile.id,
      };

      const { error } = await supabase.from('estoque_movimentacoes').insert(payload);
      if (error) throw error;

      setIsStockModalOpen(false);
      fetchPecas();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar movimentação.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBindPartToOs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOsForBinding || !selectedPecaToBindId) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        os_id: targetOsForBinding.id,
        peca_id: Number(selectedPecaToBindId),
        quantidade: Number(bindQuantidade),
        preco_unitario: Number(bindPrecoUnitario),
        fornecedor: bindFornecedor.trim() || null,
      };

      const { error } = await supabase.from('os_pecas').insert(payload);
      if (error) throw error;

      await supabase.from('estoque_movimentacoes').insert({
        peca_id: Number(selectedPecaToBindId),
        tipo: 'SAIDA',
        quantidade: Number(bindQuantidade),
        os_id: targetOsForBinding.id,
        usuario_id: userProfile.id,
        fornecedor: bindFornecedor.trim() || null,
      });

      setSelectedPecaToBindId('');
      setBindQuantidade(1);
      setBindPrecoUnitario(0);
      setBindFornecedor('');
      fetchOsPecas(targetOsForBinding.id);
      fetchPecas();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao vincular peça à OS.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPecas = pecas.filter(
    (p) =>
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo_interno.toLowerCase().includes(search.toLowerCase()) ||
      (p.modelo_compativel && p.modelo_compativel.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border-2 border-[#06402F] shadow">
        <div>
          <h2 className="text-2xl font-black text-[#06402F] font-serif flex items-center gap-3">
            <Package className="h-7 w-7 text-[#8C4580]" />
            Catálogo de Peças & Controle de Estoque
          </h2>
          <p className="text-sm font-semibold text-gray-600">
            Tabela de preços de referência, saldo e compras de peças para ordens de serviço
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openNewModal}
            className="btn-touch bg-[#8C4580] hover:bg-[#723667] text-white font-bold rounded-xl shadow flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            <span>CADASTRAR PEÇA</span>
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por código interno, nome da peça ou modelo compatível..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border-2 border-[#125938] rounded-xl pl-12 pr-4 py-3 text-base font-medium focus:outline-none focus:border-[#8C4580]"
        />
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#06402F] shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-600 font-bold">Carregando estoque de peças...</div>
        ) : filteredPecas.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-bold">Nenhuma peça cadastrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#032326] text-white font-bold text-sm uppercase tracking-wider">
                  <th className="p-4">Código / Nome</th>
                  <th className="p-4">Modelo Compatível</th>
                  <th className="p-4 text-center">Saldo em Estoque</th>
                  {isAdmin && <th className="p-4 text-center">Preços Ref. (Mín • Méd • Máx)</th>}
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm font-semibold text-gray-800">
                {filteredPecas.map((p) => {
                  const saldo = p.saldo_estoque || 0;
                  const isLowStock = saldo <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-emerald-50/50 transition">
                      <td className="p-4">
                        <span className="font-mono font-black text-xs text-[#8C4580] bg-purple-50 px-2 py-0.5 rounded border border-purple-200 block w-max mb-1">
                          {p.codigo_interno}
                        </span>
                        <span className="font-bold text-[#06402F] text-base">{p.nome}</span>
                      </td>

                      <td className="p-4 text-gray-600">
                        {p.modelo_compativel || <span className="italic text-gray-400">Universal</span>}
                      </td>

                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono font-black text-xs border ${
                            isLowStock
                              ? 'bg-red-100 text-red-900 border-red-300'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          <Layers className="h-3.5 w-3.5" />
                          {saldo} Unid.
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="p-4 text-center font-mono">
                          <div className="flex items-center justify-center gap-2 text-xs">
                            <span className="text-emerald-700 font-bold">
                              R$ {(p.preco_min || 0).toFixed(2)}
                            </span>
                            <span>•</span>
                            <span className="text-[#8C4580] font-black">
                              R$ {(p.preco_medio || 0).toFixed(2)}
                            </span>
                            <span>•</span>
                            <span className="text-rose-700 font-bold">
                              R$ {(p.preco_max || 0).toFixed(2)}
                            </span>
                          </div>
                        </td>
                      )}

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openStockModal(p)}
                            className="px-3 py-1.5 bg-[#125938] hover:bg-[#308C50] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                          >
                            <TrendingUp className="h-3.5 w-3.5" />
                            Estoque
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                              title="Editar peça"
                            >
                              <Edit2 className="h-4 w-4" />
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

      {targetOsForBinding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#F7F7E6] rounded-2xl border-4 border-[#06402F] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-[#032326] p-5 text-white border-b-4 border-[#8C4580] flex items-center justify-between">
              <div>
                <span className="font-mono font-black text-xs text-[#8C4580] bg-white px-2 py-0.5 rounded">
                  {targetOsForBinding.numero_os}
                </span>
                <h3 className="text-xl font-black font-serif mt-1">
                  Vincular Peças ao Veículo [{targetOsForBinding.veiculos?.placa}]
                </h3>
              </div>
              <button
                onClick={() => onCloseBindingModal && onCloseBindingModal()}
                className="text-white hover:text-emerald-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <form onSubmit={handleBindPartToOs} className="bg-white p-4 rounded-xl border-2 border-[#125938] space-y-3">
                <h4 className="font-bold text-[#06402F] text-sm uppercase">Adicionar Peça da Oficina</h4>

                {errorMsg && (
                  <div className="p-2 bg-red-100 text-red-900 border border-red-400 rounded text-xs font-bold">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                    Selecione a Peça no Catálogo *
                  </label>
                  <select
                    required
                    value={selectedPecaToBindId}
                    onChange={(e) => {
                      const pId = Number(e.target.value);
                      setSelectedPecaToBindId(pId);
                      const selected = pecas.find((item) => item.id === pId);
                      if (selected) {
                        setBindPrecoUnitario(selected.preco_medio || selected.preco_min || 0);
                      }
                    }}
                    className="w-full bg-[#F7F7E6] border-2 border-[#125938] rounded-xl px-3 py-2 font-semibold text-sm"
                  >
                    <option value="">Selecione...</option>
                    {pecas.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.codigo_interno}] {p.nome} (Estoque: {p.saldo_estoque || 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                      Quantidade *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={bindQuantidade}
                      onChange={(e) => setBindQuantidade(Number(e.target.value))}
                      className="w-full bg-[#F7F7E6] border-2 border-[#125938] rounded-xl px-3 py-2 font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                      Preço Unit. (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={bindPrecoUnitario}
                      onChange={(e) => setBindPrecoUnitario(Number(e.target.value))}
                      className="w-full bg-[#F7F7E6] border-2 border-[#125938] rounded-xl px-3 py-2 font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                      Fornecedor
                    </label>
                    <input
                      type="text"
                      value={bindFornecedor}
                      onChange={(e) => setBindFornecedor(e.target.value)}
                      placeholder="ex: Autoglass"
                      className="w-full bg-[#F7F7E6] border-2 border-[#125938] rounded-xl px-3 py-2 font-semibold text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-touch bg-[#8C4580] hover:bg-[#723667] text-white font-bold rounded-xl shadow"
                >
                  {submitting ? 'Adicionando...' : 'VINCULAR PEÇA E DAR BAIXA NO ESTOQUE'}
                </button>
              </form>

              <div>
                <h4 className="font-bold text-[#06402F] text-base mb-3">
                  Peças Já Utilizadas nesta OS ({osPecas.length})
                </h4>
                {osPecas.length === 0 ? (
                  <p className="text-sm italic text-gray-500 bg-white p-4 rounded-xl border">
                    Nenhuma peça vinculada a esta ordem ainda.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {osPecas.map((op) => (
                      <div
                        key={op.id}
                        className="bg-white p-3 rounded-xl border-2 border-[#125938] flex items-center justify-between text-sm"
                      >
                        <div>
                          <p className="font-bold text-[#06402F]">{op.pecas?.nome}</p>
                          <p className="text-xs text-gray-500">
                            Qtd: {op.quantidade} • Preço: R$ {(op.preco_unitario || 0).toFixed(2)} un.
                          </p>
                        </div>
                        <span className="font-extrabold text-[#8C4580] font-mono">
                          R$ {(op.quantidade * op.preco_unitario).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#F7F7E6] rounded-2xl border-4 border-[#06402F] shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-[#06402F] p-5 text-white flex items-center justify-between border-b-4 border-[#8C4580]">
              <h3 className="text-xl font-bold font-serif uppercase">
                {editingPeca ? 'Editar Peça' : 'Cadastrar Nova Peça'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-emerald-200">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSavePeca} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-100 border-2 border-red-500 rounded-xl text-red-900 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                    Código Interno *
                  </label>
                  <input
                    type="text"
                    required
                    value={codigoInterno}
                    onChange={(e) => setCodigoInterno(e.target.value.toUpperCase())}
                    className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-mono font-black focus:outline-none focus:border-[#8C4580]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                    Nome da Peça *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="ex: Amortecedor Dianteiro"
                    className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-[#8C4580]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                  Modelo Compatível
                </label>
                <input
                  type="text"
                  value={modeloCompativel}
                  onChange={(e) => setModeloCompativel(e.target.value)}
                  placeholder="ex: Honda Civic / HR-V 2017+"
                  className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-[#8C4580]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                    Preço Mín (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={precoMin}
                    onChange={(e) => setPrecoMin(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-white border-2 border-[#125938] rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-[#8C4580]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                    Preço Médio (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={precoMedio}
                    onChange={(e) => setPrecoMedio(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-white border-2 border-[#125938] rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-[#8C4580]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                    Preço Máx (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={precoMax}
                    onChange={(e) => setPrecoMax(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-white border-2 border-[#125938] rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-[#8C4580]"
                  />
                </div>
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
                  {submitting ? 'Salvando...' : 'SALVAR PEÇA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isStockModalOpen && selectedPeca && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#F7F7E6] rounded-2xl border-4 border-[#06402F] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-[#032326] p-5 text-white flex items-center justify-between border-b-4 border-[#8C4580]">
              <div>
                <span className="font-mono font-black text-xs text-[#8C4580] bg-white px-2 py-0.5 rounded">
                  {selectedPeca.codigo_interno}
                </span>
                <h3 className="text-xl font-black font-serif mt-0.5">{selectedPeca.nome}</h3>
              </div>
              <button onClick={() => setIsStockModalOpen(false)} className="text-white hover:text-emerald-200">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleStockMovement} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-100 text-red-900 border border-red-500 rounded text-xs font-bold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                  Tipo de Movimentação *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoMovimentacao('ENTRADA')}
                    className={`py-3 rounded-xl font-bold text-sm border-2 transition ${
                      tipoMovimentacao === 'ENTRADA'
                        ? 'bg-emerald-600 text-white border-emerald-800'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    + ENTRADA (COMPRA)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoMovimentacao('SAIDA')}
                    className={`py-3 rounded-xl font-bold text-sm border-2 transition ${
                      tipoMovimentacao === 'SAIDA'
                        ? 'bg-red-600 text-white border-red-800'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    - SAÍDA (CONSUMO)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                  Quantidade *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantidade}
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                  className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-bold text-lg focus:outline-none focus:border-[#8C4580]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#06402F] mb-1">
                  Fornecedor / Origem (Opcional)
                </label>
                <input
                  type="text"
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value)}
                  placeholder="ex: Distribuidora de Peças Bragança"
                  className="w-full bg-white border-2 border-[#125938] rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-[#8C4580]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-touch bg-[#8C4580] hover:bg-[#723667] text-white font-bold rounded-xl shadow"
                >
                  {submitting ? 'Gravando...' : 'REGISTRAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
