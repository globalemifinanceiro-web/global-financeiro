// Google Apps Script — recebe um comprovante enviado pela Edge Function "registrar-comprovante"
// do Supabase e salva na pasta "comprovantes" do Google Drive, usando o espaço da conta dona do
// script (contas de serviço do Google não têm espaço próprio no Meu Drive).
//
// Configuração (uma vez, na conta dona da pasta):
//   1. script.google.com → Novo projeto → cole este código.
//   2. Configurações do projeto (engrenagem) → Propriedades do script → adicionar
//      TOKEN = (o mesmo valor do segredo APPS_SCRIPT_TOKEN no Supabase).
//   3. Implantar → Nova implantação → tipo "App da Web" → Executar como: Eu →
//      Quem pode acessar: Qualquer pessoa → Implantar → autorizar.
//   4. A URL do app da Web vira o segredo APPS_SCRIPT_URL no Supabase.

const FOLDER_ID = '1crfnZm4h-RDnia7epab9PqTqMYvq4cAH';

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);
    const esperado = PropertiesService.getScriptProperties().getProperty('TOKEN');
    if (!esperado || dados.token !== esperado) return responder({ error: 'Não autorizado' });
    if (!dados.base64 || !dados.nome) return responder({ error: 'Arquivo ausente' });

    const bytes = Utilities.base64Decode(dados.base64);
    const blob = Utilities.newBlob(bytes, dados.mimeType || 'application/octet-stream', dados.nome);
    const arquivo = DriveApp.getFolderById(FOLDER_ID).createFile(blob);
    return responder({ id: arquivo.getId(), url: arquivo.getUrl(), nome: arquivo.getName() });
  } catch (err) {
    return responder({ error: String(err) });
  }
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
