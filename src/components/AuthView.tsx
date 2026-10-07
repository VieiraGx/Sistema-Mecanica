import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wrench, KeyRound, Mail, User, AlertCircle, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  onAuthSuccess: () => void;
}

export const AuthView: React.FC<AuthModalProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!nome.trim()) {
          throw new Error('Por favor, informe seu nome completo.');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              nome: nome,
              email: email,
              perfil: 'MECANICO',
            }, { onConflict: 'id' });

          if (profileError) {
            console.warn('Erro ao atualizar perfil inicial:', profileError.message);
          }
        }

        setSuccessMsg('Cadastro realizado com sucesso! Você já pode acessar.');
        setTimeout(() => {
          setIsSignUp(false);
        }, 1500);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        onAuthSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro durante a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#032326] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#F7F7E6] rounded-2xl shadow-2xl border-4 border-[#06402F] overflow-hidden">
        <div className="bg-[#06402F] p-8 text-center text-white border-b-4 border-[#8C4580]">
          <div className="inline-flex p-4 bg-[#8C4580] rounded-2xl mb-3 shadow-lg">
            <Wrench className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-black tracking-wider uppercase font-serif">
            Shibuya <span className="text-[#8C4580]">Motores</span>
          </h2>
          <p className="text-sm text-emerald-200 mt-1 font-semibold">
            Sistema de Gestão - Oficina & Funilaria
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-[#06402F]">
              {isSignUp ? 'Criar Nova Conta' : 'Acessar o Sistema'}
            </h3>
            <p className="text-sm text-gray-700">
              {isSignUp
                ? 'Preencha seus dados para solicitar cadastro de mecânico'
                : 'Digite suas credenciais de acesso'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-100 border-2 border-red-500 rounded-xl text-red-900 text-sm font-bold flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-100 border-2 border-emerald-500 rounded-xl text-emerald-900 text-sm font-bold flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold uppercase text-[#06402F] mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-white border-2 border-[#125938] rounded-xl pl-11 pr-4 py-3 font-semibold focus:outline-none focus:border-[#8C4580]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-[#06402F] mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-white border-2 border-[#125938] rounded-xl pl-11 pr-4 py-3 font-semibold focus:outline-none focus:border-[#8C4580]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#06402F] mb-1.5">
                Senha
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border-2 border-[#125938] rounded-xl pl-11 pr-4 py-3 font-semibold focus:outline-none focus:border-[#8C4580]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-touch bg-[#8C4580] hover:bg-[#723667] text-white text-lg font-black tracking-wide rounded-xl shadow-lg transition duration-200"
            >
              {loading ? (
                <span>Aguarde...</span>
              ) : isSignUp ? (
                'CADASTRAR'
              ) : (
                'ENTRAR NO SISTEMA'
              )}
            </button>
          </form>

          <div className="pt-4 text-center border-t border-gray-300">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-sm font-bold text-[#06402F] hover:text-[#8C4580] underline"
            >
              {isSignUp
                ? 'Já possui uma conta? Faça Login'
                : 'Não tem conta? Cadastre-se como mecânico'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
