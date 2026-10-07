export type UserPerfil = 'ADMINISTRADOR' | 'MECANICO';

export type StatusOS =
  | 'RECEBIDO'
  | 'EM_DIAGNOSTICO'
  | 'AGUARDANDO_APROVACAO'
  | 'AGUARDANDO_PECAS'
  | 'EM_FUNILARIA'
  | 'EM_MECANICA'
  | 'TESTE_QUALIDADE'
  | 'PRONTO_PARA_ENTREGA'
  | 'ENTREGUE';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  perfil: UserPerfil;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  cpf?: string | null;
  endereco?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Veiculo {
  id: number;
  cliente_id: number;
  placa: string;
  modelo: string;
  cor?: string | null;
  ano?: number | null;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
  clientes?: Cliente;
}

export interface OrdemServico {
  id: number;
  numero_os: string;
  cliente_id: number;
  veiculo_id: number;
  data_entrada: string;
  previsao_entrega?: string | null;
  responsavel_id: string;
  status: StatusOS;
  valor_mao_obra: number;
  placa_verificada: boolean;
  data_entrega?: string | null;
  criado_por: string;
  created_at: string;
  updated_at: string;
  clientes?: Cliente;
  veiculos?: Veiculo;
  responsavel?: Profile;
  criador?: Profile;
  tipos_servico?: string[];
  valor_total?: number;
}

export interface OsServico {
  id: number;
  os_id: number;
  descricao: string;
  valor: number;
  created_at: string;
}

export interface OsPeca {
  id: number;
  os_id: number;
  peca_id: number;
  quantidade: number;
  preco_unitario: number;
  fornecedor?: string | null;
  created_at: string;
  pecas?: Peca;
}

export interface Peca {
  id: number;
  codigo_interno: string;
  nome: string;
  modelo_compativel?: string | null;
  preco_min?: number | null;
  preco_medio?: number | null;
  preco_max?: number | null;
  data_ultima_atualizacao: string;
  created_at: string;
  saldo_estoque?: number;
}

export interface OsAtualizacao {
  id: number;
  os_id: number;
  usuario_id: string;
  status_anterior?: StatusOS | null;
  status_novo?: StatusOS | null;
  observacao?: string | null;
  created_at: string;
  profiles?: Profile;
}

export interface VerificacaoPlaca {
  id: number;
  veiculo_id: number;
  os_id?: number | null;
  data_hora: string;
  responsavel_id: string;
  observacao?: string | null;
  created_at: string;
  veiculos?: Veiculo;
  responsavel?: Profile;
}
