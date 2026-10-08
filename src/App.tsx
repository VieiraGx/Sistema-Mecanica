import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Profile, OrdemServico, Veiculo } from './types/database';
import { AuthView } from './components/AuthView';
import { Layout } from './components/Layout';
import { OsView } from './components/OsView';
import { ClientesView } from './components/ClientesView';
import { VeiculosView } from './components/VeiculosView';
import { VerificacaoPlacaView } from './components/VerificacaoPlacaView';
import { OsTimelineModal } from './components/OsTimelineModal';
import { PecasView } from './components/PecasView';
import { DashboardView } from './components/DashboardView';
import { Wrench } from 'lucide-react';

export const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('os');
  const [searchTerm, setSearchTerm] = useState('');

  const [activeTimelineOs, setActiveTimelineOs] = useState<OrdemServico | null>(null);
  const [activePartsOs, setActivePartsOs] = useState<OrdemServico | null>(null);
  const [verificationTargetVeiculo, setVerificationTargetVeiculo] = useState<Veiculo | null>(null);
  const [filterClientIdForVehicles, setFilterClientIdForVehicles] = useState<number | null>(null);

  const fetchProfile = async (userId: string, emailStr?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            nome: emailStr?.split('@')[0] || 'Usuário',
            email: emailStr || '',
            perfil: 'MECANICO',
          })
          .select()
          .single();

        if (!createError && newProfile) {
          setUserProfile(newProfile);
        }
      } else if (data) {
        setUserProfile(data);
      }
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Eager Supabase connection check
    Promise.resolve(
      supabase.from('profiles').select('count', { count: 'exact', head: true })
    ).then(({ error }) => {
      if (error) {
        console.info('Supabase ping status:', error.message);
      } else {
        console.info('Conexão com o Supabase estabelecida com sucesso.');
      }
    }).catch((err: any) => console.warn('Supabase ping warning:', err));

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleNavigateToVerification = (v: Veiculo) => {
    setVerificationTargetVeiculo(v);
    setActiveTab('verificacao');
  };

  const handleOpenTimeline = (os: OrdemServico) => {
    setActiveTimelineOs(os);
  };

  const handleOpenPartsModal = (os: OrdemServico) => {
    setActivePartsOs(os);
    setActiveTab('pecas');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#032326] flex flex-col items-center justify-center text-white">
        <div className="animate-spin p-4 bg-[#8C4580] rounded-2xl mb-4 shadow-xl">
          <Wrench className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-xl font-black font-serif uppercase tracking-wider">
          Carregando Shibuya Motores...
        </h2>
      </div>
    );
  }

  if (!session || !userProfile) {
    return <AuthView onAuthSuccess={() => {}} />;
  }

  return (
    <Layout
      userProfile={userProfile}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
    >
      <div className="space-y-6">
        {activeTab === 'os' && (
          <OsView
            userProfile={userProfile}
            searchTerm={searchTerm}
            onOpenTimelineModal={handleOpenTimeline}
            onOpenPartsModal={handleOpenPartsModal}
            onNavigateToVerification={handleNavigateToVerification}
          />
        )}

        {activeTab === 'clientes' && (
          <ClientesView
            userProfile={userProfile}
            onViewVehiclesForClient={(clientId) => {
              setFilterClientIdForVehicles(clientId);
              setActiveTab('veiculos');
            }}
          />
        )}

        {activeTab === 'veiculos' && (
          <VeiculosView
            userProfile={userProfile}
            filterClientId={filterClientIdForVehicles}
            onOpenPlateVerification={handleNavigateToVerification}
          />
        )}

        {activeTab === 'verificacao' && (
          <VerificacaoPlacaView
            userProfile={userProfile}
            targetVeiculo={verificationTargetVeiculo}
            onClearTargetVeiculo={() => setVerificationTargetVeiculo(null)}
          />
        )}

        {activeTab === 'pecas' && (
          <PecasView
            userProfile={userProfile}
            targetOsForBinding={activePartsOs}
            onCloseBindingModal={() => setActivePartsOs(null)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            userProfile={userProfile}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTimelineOs && (
          <OsTimelineModal
            os={activeTimelineOs}
            userProfile={userProfile}
            onClose={() => setActiveTimelineOs(null)}
          />
        )}
      </div>
    </Layout>
  );
};

export default App;
