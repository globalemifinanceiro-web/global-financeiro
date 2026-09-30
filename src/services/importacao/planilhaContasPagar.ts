import * as XLSX from 'xlsx';
import { noPeriodo } from '@/utils/periodo';

export type SituacaoContaPagar = 'pendente' | 'paga' | 'cancelada';

export interface LinhaContaPagar {
  fornecedor: string;
  projeto: string | null;
  categoria: string | null;
  departamento: string | null;
  numero_documento: string | null;
  vencimento: string;
  valor: number;
  situacao: SituacaoContaPagar;
  dt_pagamento: string | null;
  observacao: string | null;
}

export interface LeituraPlanilha {
  aba: string;
  linhas: LinhaContaPagar[];
  /** AAAA-MM de vencimento presentes — são os meses substituídos na importação. */
  meses: string[];
  /** CNPJs (só dígitos) da coluna "Minha Empresa (CNPJ)", quando existir. */
  cnpjsNoArquivo: string[];
  ignoradas: number;
  /** Campo do app → cabeçalho encontrado na planilha. */
  colunas: Record<string, string>;
}

type Campo =
  | 'fornecedor'
  | 'projeto'
  | 'categoria'
  | 'departamento'
  | 'numero'
  | 'vencimento'
  | 'valor'
  | 'situacao'
  | 'dtPagamento'
  | 'observacao'
  | 'cnpjEmpresa';

// Em ordem de preferência: o primeiro cabeçalho encontrado vence.
const SINONIMOS: Record<Campo, string[]> = {
  fornecedor: ['razao social', 'fornecedor', 'cliente ou fornecedor (nome fantasia)', 'cliente ou fornecedor', 'nome fantasia', 'favorecido', 'credor'],
  projeto: ['projeto', 'obra', 'projeto/obra'],
  categoria: ['categoria', 'grupo'],
  departamento: ['departamento', 'centro de custo'],
  numero: ['nota fiscal', 'numero do documento', 'documento', 'nf', 'n nf', 'numero'],
  vencimento: ['vencimento', 'data de vencimento', 'dt vencimento', 'data vencimento'],
  valor: ['valor liquido', 'valor da conta', 'valor', 'valor (r$)', 'valor total'],
  situacao: ['situacao', 'status'],
  dtPagamento: [
    'ultima data de pagto ou recbto (completa)',
    'data de pagamento',
    'data do pagamento',
    'dt pgto',
    'dt pagamento',
    'data pagto',
    'pago em',
  ],
  observacao: ['observacao da conta', 'observacao', 'observacoes', 'historico'],
  cnpjEmpresa: ['minha empresa (cnpj)'],
};

const CAMPOS_OBRIGATORIOS: Campo[] = ['fornecedor', 'vencimento', 'valor'];

function normalizar(texto: unknown): string {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[º°.:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function mapearCabecalho(linha: unknown[]): Partial<Record<Campo, number>> | null {
  const normalizados = linha.map(normalizar);
  const mapa: Partial<Record<Campo, number>> = {};
  for (const campo of Object.keys(SINONIMOS) as Campo[]) {
    for (const sinonimo of SINONIMOS[campo]) {
      const indice = normalizados.indexOf(sinonimo);
      if (indice >= 0) {
        mapa[campo] = indice;
        break;
      }
    }
  }
  return CAMPOS_OBRIGATORIOS.every((campo) => mapa[campo] !== undefined) ? mapa : null;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Aceita serial de data do Excel, "dd/mm/aaaa" e "aaaa-mm-dd". */
function paraDataIso(valor: unknown): string | null {
  if (typeof valor === 'number' && valor > 0) {
    const d = XLSX.SSF.parse_date_code(valor);
    return d ? `${d.y}-${pad(d.m)}-${pad(d.d)}` : null;
  }
  if (typeof valor !== 'string') return null;
  const texto = valor.trim();
  const br = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})(?!\d)/);
  if (br) {
    const ano = br[3].length === 2 ? `20${br[3]}` : br[3];
    return `${ano}-${pad(Number(br[2]))}-${pad(Number(br[1]))}`;
  }
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : null;
}

/** Aceita número ou texto brasileiro ("R$ 1.234,56", "-1.234,56"); contas a pagar vêm negativas na Omie. */
function paraValor(valor: unknown): number | null {
  if (typeof valor === 'number') return Number.isFinite(valor) ? Math.abs(valor) : null;
  if (typeof valor !== 'string') return null;
  const limpo = valor.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  const numero = Number(limpo);
  return Number.isFinite(numero) && limpo !== '' ? Math.abs(numero) : null;
}

function paraTexto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).trim();
  return texto === '' ? null : texto;
}

function situacaoDe(textoSituacao: string | null, dtPagamento: string | null): SituacaoContaPagar {
  const t = normalizar(textoSituacao);
  if (t.includes('cancel')) return 'cancelada';
  // \b evita que "a pagar" seja lido como "paga".
  if (/\b(pago|paga|liquidad[oa]|quitad[oa]|baixad[oa])\b/.test(t)) return 'paga';
  return dtPagamento ? 'paga' : 'pendente';
}

export function lerPlanilhaContasPagar(conteudo: ArrayBuffer): LeituraPlanilha {
  const livro = XLSX.read(conteudo, { type: 'array' });

  for (const aba of livro.SheetNames) {
    const linhas = XLSX.utils.sheet_to_json<unknown[]>(livro.Sheets[aba], { header: 1, raw: true, defval: null });

    // O cabeçalho pode não ser a primeira linha (a Omie põe um título em cima).
    for (let i = 0; i < Math.min(linhas.length, 15); i++) {
      const mapa = mapearCabecalho(linhas[i] ?? []);
      if (!mapa) continue;

      const cabecalho = linhas[i];
      const colunas: Record<string, string> = {};
      for (const [campo, indice] of Object.entries(mapa)) colunas[campo] = String(cabecalho[indice as number]);

      const lidas: LinhaContaPagar[] = [];
      const cnpjs = new Set<string>();
      let ignoradas = 0;
      const pegar = (linha: unknown[], campo: Campo) => (mapa[campo] === undefined ? null : linha[mapa[campo] as number]);

      for (const linha of linhas.slice(i + 1)) {
        if (!linha || linha.every((celula) => celula === null || celula === '')) continue;
        const fornecedor = paraTexto(pegar(linha, 'fornecedor'));
        const vencimento = paraDataIso(pegar(linha, 'vencimento'));
        const valor = paraValor(pegar(linha, 'valor'));
        // Linhas de total/subtotal não têm fornecedor ou data.
        if (!fornecedor || !vencimento || !valor) {
          ignoradas++;
          continue;
        }
        const dtPagamento = paraDataIso(pegar(linha, 'dtPagamento'));
        const situacao = situacaoDe(paraTexto(pegar(linha, 'situacao')), dtPagamento);

        // Mesmo recorte do resto do app: histórico só do ano vigente; pendentes, de qualquer ano.
        const referencia = situacao === 'paga' ? (dtPagamento ?? vencimento) : vencimento;
        if (!noPeriodo(referencia, situacao === 'pendente')) {
          ignoradas++;
          continue;
        }

        const cnpj = paraTexto(pegar(linha, 'cnpjEmpresa'))?.replace(/\D/g, '');
        if (cnpj) cnpjs.add(cnpj);

        lidas.push({
          fornecedor,
          projeto: paraTexto(pegar(linha, 'projeto')),
          categoria: paraTexto(pegar(linha, 'categoria')),
          departamento: paraTexto(pegar(linha, 'departamento')),
          numero_documento: paraTexto(pegar(linha, 'numero')),
          vencimento,
          valor,
          situacao,
          dt_pagamento: situacao === 'paga' ? dtPagamento : null,
          observacao: paraTexto(pegar(linha, 'observacao')),
        });
      }

      return {
        aba,
        linhas: lidas,
        meses: Array.from(new Set(lidas.map((l) => l.vencimento.slice(0, 7)))).sort(),
        cnpjsNoArquivo: Array.from(cnpjs),
        ignoradas,
        colunas,
      };
    }
  }

  throw new Error(
    'Não encontrei o cabeçalho da planilha. Ela precisa ter pelo menos as colunas de fornecedor (ex.: "Razão Social" ou "Fornecedor"), "Vencimento" e "Valor".'
  );
}
