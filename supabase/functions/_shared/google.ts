// Autenticação de conta de serviço do Google (JWT assinado -> token de acesso OAuth2) e
// constantes da planilha de Contas a Receber, compartilhadas pelas Edge Functions.

export const CONTAS_RECEBER_SPREADSHEET_ID = '10jVzX0nBgAP74YCVCxVQb8uDlfvFZtyLBaPxD2hIsZM';
export const CONTAS_RECEBER_ABA = 'à Receber';

export const SCOPE_SHEETS_LEITURA = 'https://www.googleapis.com/auth/spreadsheets.readonly';
export const SCOPE_SHEETS_ESCRITA = 'https://www.googleapis.com/auth/spreadsheets';

// Serial de data do Google Sheets: dias desde 30/12/1899.
const SERIAL_EPOCH_UTC_MS = Date.UTC(1899, 11, 30);

export function serialParaIso(serial: number): string {
  return new Date(SERIAL_EPOCH_UTC_MS + Math.round(serial) * 86400000).toISOString().slice(0, 10);
}

export function stripAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function base64UrlFromBytes(bytes: Uint8Array): string {
  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlFromString(texto: string): string {
  return base64UrlFromBytes(new TextEncoder().encode(texto));
}

function pemParaDer(pem: string): ArrayBuffer {
  const limpo = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s+/g, '');
  const binario = atob(limpo);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes.buffer;
}

/** Lê GOOGLE_SERVICE_ACCOUNT_JSON e devolve um token de acesso para o escopo pedido. */
export async function obterTokenGoogle(scope: string): Promise<string> {
  const saJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!saJson) throw new Error('Integração com o Google não configurada (falta o segredo no backend).');
  const sa = JSON.parse(saJson);

  const agora = Math.floor(Date.now() / 1000);
  const header = base64UrlFromString(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64UrlFromString(
    JSON.stringify({ iss: sa.client_email, scope, aud: 'https://oauth2.googleapis.com/token', exp: agora + 3600, iat: agora })
  );
  const entrada = `${header}.${claims}`;

  const chave = await crypto.subtle.importKey('pkcs8', pemParaDer(sa.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const assinatura = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chave, new TextEncoder().encode(entrada));
  const jwt = `${entrada}.${base64UrlFromBytes(new Uint8Array(assinatura))}`;

  const resposta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  if (!resposta.ok) throw new Error(`Falha ao autenticar no Google (HTTP ${resposta.status}): ${await resposta.text()}`);
  const dados = await resposta.json();
  return dados.access_token as string;
}

export function urlValoresPlanilha(spreadsheetId: string, range: string): string {
  return `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
}
