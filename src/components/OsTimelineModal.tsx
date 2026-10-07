import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { OrdemServico, OsAtualizacao, Profile } from '../types/database';
import { STATUS_MAP } from './OsView';
import { Clock, Send, X, AlertCircle, MessageSquare, ArrowRight, User, CheckCircle2 } from 'lucide-react';

interface OsTimelineModalProps {
  os: OrdemServico;
  userProfile: Profile;
  onClose: () => void;
}

export const OsTimelineModal: React.FC<OsTimelineModalProps> = ({
  os,
  userProfile,
  onClose,
}) => {
  const [atualizacoes, setAtualizacoes] = useState<OsAtualizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaNota, setNovaNota] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAtualizacoes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('os_atualizacoes')
        .select('*, profiles(*)')
        .eq('os_id', os.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAtualizacoes(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar histórico da OS:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAtualizacoes();

    const channel = supabase
      .channel(`os_atualizacoes_${os.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'os_atualizacoes',
          filter: `os_id=eq.${os.id}`,
        },
        () => {
          fetchAtualizacoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [os.id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaNota.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        os_id: os.id,
        usuario_id: userProfile.id,
        status_anterior: os.status,
        status_novo: os.status,
        observacao: novaNota.trim(),
      };

      const { error } = await supabase.from('os_atualizacoes').insert(payload);

      if (error) throw error;

      setNovaNota('');
      fetchAtualizacoes();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar atualização.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#F7F7E6] rounded-2xl border-4 border-[#06402F] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-[#032326] p-5 text-white border-b-4 border-[#8C4580] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-xs text-[#8C4580] bg-white px-2 py-0.5 rounded">
                {os.numero_os}
              </span>
              <span className="px-2.5 py-0.5 bg-[#125938] text-emerald-200 font-mono font-black rounded text-xs">
                {os.veiculos?.placa}
              </span>
            </div>
            <h3 className="text-xl font-black font-serif mt-1">
              Feed de Atualizações & Histórico
            </h3>
          </div>
          <button onClick={onClose} className="text-white hover:text-emerald-200">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="p-8 text-center text-gray-600 font-bold">
              Carregando linha do tempo...
            </div>
          ) : atualizacoes.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-bold italic">
              Nenhuma atualização registrada ainda nesta OS.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-1 before:bg-[#125938]">
              {atualizacoes.map((item) => {
                const isStatusChange =
                  item.status_anterior &&
                  item.status_novo &&
                  item.status_anterior !== item.status_novo;

                return (
                  <div key={item.id} className="relative group">
                    <div className="absolute -left-6 top-1 h-6 w-6 rounded-full bg-[#8C4580] border-2 border-white flex items-center justify-center text-white shadow">
                      {isStatusChange ? (
                        <ArrowRight className="h-3 w-3" />
                      ) : (
                        <MessageSquare className="h-3 w-3" />
                      )}
                    </div>

                    <div className="bg-white p-4 rounded-xl border-2 border-[#125938] shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-[#06402F]">
                          <User className="h-3.5 w-3.5 text-[#8C4580]" />
                          {item.profiles?.nome || 'Usuário'} (
                          <span className="uppercase">{item.profiles?.perfil}</span>)
                        </span>
                        <span className="text-gray-500 flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {new Date(item.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      {isStatusChange && item.status_anterior && item.status_novo && (
                        <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-xs font-black">
                          <span className={`px-2 py-0.5 rounded border ${STATUS_MAP[item.status_anterior].bg} ${STATUS_MAP[item.status_anterior].text}`}>
                            {STATUS_MAP[item.status_anterior].label}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-[#8C4580]" />
                          <span className={`px-2 py-0.5 rounded border ${STATUS_MAP[item.status_novo].bg} ${STATUS_MAP[item.status_novo].text}`}>
                            {STATUS_MAP[item.status_novo].label}
                          </span>
                        </div>
                      )}

                      {item.observacao && (
                        <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                          {item.observacao}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t-2 border-[#06402F]">
          {errorMsg && (
            <div className="mb-2 p-2 bg-red-100 border border-red-400 rounded-lg text-red-900 text-xs font-bold flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              type="text"
              required
              value={novaNota}
              onChange={(e) => setNovaNota(e.target.value)}
              placeholder="Registrar nota técnica (ex: Cabeçote desmontado, válvulas retificadas)..."
              className="flex-1 bg-[#F7F7E6] border-2 border-[#125938] rounded-xl px-4 py-2.5 font-semibold text-sm focus:outline-none focus:border-[#8C4580]"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#8C4580] hover:bg-[#723667] text-white font-bold rounded-xl shadow flex items-center gap-2 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
              <span>POSTAR</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
