import { useRef, useState, type CSSProperties, type DragEvent } from 'react';
import { colors, radius, spacing } from '@/theme';
import type { ArquivoLido } from './arquivo';

/** Web: área para arrastar e soltar a planilha, com opção de procurar no computador. */
export function AreaArquivo({ onArquivo, desabilitado }: { onArquivo: (arquivo: ArquivoLido) => void; desabilitado?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);

  async function ler(arquivo: File | undefined) {
    if (!arquivo || desabilitado) return;
    onArquivo({ nome: arquivo.name, conteudo: await arquivo.arrayBuffer() });
  }

  function aoSoltar(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setArrastando(false);
    ler(evento.dataTransfer.files?.[0]);
  }

  const estilo: CSSProperties = {
    border: `2px dashed ${arrastando ? colors.blue : colors.border}`,
    backgroundColor: arrastando ? colors.blueSoft : colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    textAlign: 'center',
    cursor: desabilitado ? 'default' : 'pointer',
    opacity: desabilitado ? 0.5 : 1,
    fontFamily: 'inherit',
    color: colors.textSecondary,
    fontSize: 14,
  };

  return (
    <div
      style={estilo}
      onClick={() => !desabilitado && input.current?.click()}
      onDragOver={(evento) => {
        evento.preventDefault();
        if (!desabilitado) setArrastando(true);
      }}
      onDragLeave={() => setArrastando(false)}
      onDrop={aoSoltar}
    >
      <div style={{ color: colors.textPrimary, fontWeight: 600, marginBottom: 4 }}>Arraste a planilha aqui</div>
      <div>ou clique para procurar no computador (.xlsx, .xls ou .csv)</div>
      <input
        ref={input}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={(evento) => {
          ler(evento.target.files?.[0]);
          evento.target.value = '';
        }}
      />
    </div>
  );
}
