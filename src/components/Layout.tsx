import React, { ReactNode } from 'react';
import {
  Wrench,
  Users,
  Car,
  FileText,
  Package,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  User,
  Search
} from 'lucide-react';
import { Profile } from '../types/database';

interface NavbarProps {
  userProfile: Profile | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  children: ReactNode;
}

export const Layout: React.FC<NavbarProps> = ({
  userProfile,
  activeTab,
  setActiveTab,
  onLogout,
  searchTerm,
  setSearchTerm,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isAdmin = userProfile?.perfil === 'ADMINISTRADOR';

  const navItems = [
    { id: 'os', label: 'Ordens de Serviço', icon: FileText, show: true },
    { id: 'veiculos', label: 'Veículos', icon: Car, show: true },
    { id: 'clientes', label: 'Clientes', icon: Users, show: isAdmin },
    { id: 'pecas', label: 'Peças & Estoque', icon: Package, show: true },
    { id: 'verificacao', label: 'Auditoria Placas', icon: ShieldCheck, show: isAdmin },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, show: isAdmin },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F7E6] flex flex-col font-sans">
      <header className="bg-[#032326] text-white border-b-4 border-[#8C4580] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('os')}>
              <div className="bg-[#8C4580] p-2.5 rounded-xl shadow-md">
                <Wrench className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-wider text-white font-serif uppercase">
                  Shibuya <span className="text-[#8C4580]">Motores</span>
                </h1>
                <p className="text-xs text-emerald-300 font-semibold tracking-wide">
                  Mecânica & Funilaria • Bragança Paulista
                </p>
              </div>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por placa, cliente ou nº da OS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#125938] text-white placeholder-emerald-200 pl-11 pr-4 py-2.5 rounded-lg border-2 border-[#308C50] focus:outline-none focus:border-[#8C4580] text-sm font-medium"
                />
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-3 bg-[#125938] px-4 py-2 rounded-xl border border-[#308C50]">
                <div className="bg-[#06402F] p-2 rounded-lg text-emerald-300">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white line-clamp-1">{userProfile?.nome}</div>
                  <div className="text-xs font-extrabold uppercase text-[#8C4580] tracking-wider">
                    {userProfile?.perfil}
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="btn-touch bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl shadow-md flex items-center gap-2 px-4 py-2.5"
                title="Sair do sistema"
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </button>
            </div>

            <div className="lg:hidden flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-3 rounded-lg bg-[#125938] text-white border border-[#308C50]"
                aria-label="Abrir menu"
              >
                {mobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
              </button>
            </div>
          </div>
        </div>

        <div className="md:hidden px-4 pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por placa, cliente ou nº OS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#125938] text-white placeholder-emerald-200 pl-11 pr-4 py-2 rounded-lg border border-[#308C50] text-sm"
            />
          </div>
        </div>

        <div className="hidden lg:block bg-[#06402F] border-t border-[#125938]">
          <div className="max-w-7xl mx-auto px-4 flex gap-2 py-1.5">
            {navItems.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-base transition-all ${
                    isActive
                      ? 'bg-[#8C4580] text-white shadow-lg ring-2 ring-white/20'
                      : 'text-emerald-100 hover:bg-[#125938] hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#032326] border-b-4 border-[#8C4580] px-4 pt-3 pb-6 space-y-3 z-40">
          <div className="flex items-center justify-between p-3 bg-[#125938] rounded-xl text-white mb-4">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-emerald-300" />
              <div>
                <p className="font-bold text-sm">{userProfile?.nome}</p>
                <p className="text-xs text-[#8C4580] font-black uppercase">{userProfile?.perfil}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-700 px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>

          <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider px-1">Navegação Principal</p>
          <div className="grid grid-cols-1 gap-2">
            {navItems.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-bold text-left ${
                    isActive
                      ? 'bg-[#8C4580] text-white shadow'
                      : 'bg-[#125938] text-emerald-100 hover:bg-[#308C50]'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      <footer className="bg-[#032326] text-emerald-200 border-t-2 border-[#125938] py-4 px-6 text-center text-sm">
        <p className="font-semibold">
          Shibuya Motores — Sistema de Gestão de Ordens de Serviço • Bragança Paulista, SP
        </p>
      </footer>
    </div>
  );
};
