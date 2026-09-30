import * as DocumentPicker from 'expo-document-picker';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import type { ArquivoLido } from './arquivo';

const TIPOS_PLANILHA = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
];

/** Celular: só o botão de procurar (arrastar e soltar existe apenas na versão web, AreaArquivo.web.tsx). */
export function AreaArquivo({ onArquivo, desabilitado }: { onArquivo: (arquivo: ArquivoLido) => void; desabilitado?: boolean }) {
  async function procurar() {
    const resultado = await DocumentPicker.getDocumentAsync({ type: TIPOS_PLANILHA, copyToCacheDirectory: true });
    if (resultado.canceled || !resultado.assets?.[0]) return;
    const item = resultado.assets[0];
    const conteudo = await (await fetch(item.uri)).arrayBuffer();
    onArquivo({ nome: item.name, conteudo });
  }

  return <PrimaryButton label="Procurar planilha" variant="ghost" onPress={procurar} disabled={desabilitado} />;
}
