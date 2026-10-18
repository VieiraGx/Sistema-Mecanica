export const normalizeText = (text?: string | null): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
};

export const matchesNormalizedSearch = (target?: string | null, search?: string | null): boolean => {
  if (!search || !search.trim()) return true;
  if (!target) return false;

  const normalizedTarget = normalizeText(target);
  const normalizedSearch = normalizeText(search);

  if (normalizedTarget.includes(normalizedSearch)) return true;

  const searchTerms = search.toLowerCase().trim().split(/\s+/);
  return searchTerms.every((term) => normalizeText(target).includes(normalizeText(term)));
};

export const generateLaudoText = (os: any): string => {
  const dateStr = new Date(os.created_at || Date.now()).toLocaleDateString('pt-BR');
  const totalStr = (os.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const maoObraStr = (os.valor_mao_obra || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return `
==================================================
        SHIBUYA MOTORES - OFICINA & FUNILARIA
         ORÇAMENTO E LAUDO TÉCNICO DE MANUTENÇÃO
==================================================
Data de Emissão: ${dateStr}
Nº da Ordem de Serviço: ${os.numero_os}

DADOS DO CLIENTE:
Nome: ${os.clientes?.nome || 'N/I'}
Telefone: ${os.clientes?.telefone || 'N/I'}
CPF: ${os.clientes?.cpf || 'N/I'}

DADOS DO VEÍCULO:
Placa: ${os.veiculos?.placa || 'N/I'}
Modelo: ${os.veiculos?.modelo || 'N/I'}
Cor: ${os.veiculos?.cor || 'N/I'}
Ano: ${os.veiculos?.ano || 'N/I'}

RESPONSÁVEL TÉCNICO:
Mecânico: ${os.responsavel?.nome || 'Equipe Shibuya'}

DETALHAMENTO DO SERVIÇO:
- Tipo de Serviço: ${os.tipos_servico?.join(', ') || 'Mecânica/Funilaria'}
- Status Atual: ${os.status}
- Mão de Obra: R$ ${maoObraStr}

==================================================
VALOR TOTAL DO ORÇAMENTO: R$ ${totalStr}
==================================================

Shibuya Motores — Bragança Paulista, SP
Telefone: (11) 98765-4321
`.trim();
};
