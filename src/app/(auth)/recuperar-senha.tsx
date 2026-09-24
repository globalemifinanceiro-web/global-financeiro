import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AuthScreenFrame } from '@/components/auth/AuthScreenFrame';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { supabase } from '@/services/supabase/client';
import { colors, typography } from '@/theme';

export default function RecuperarSenhaScreen() {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleEnviar() {
    setEnviando(true);
    setErro(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setEnviando(false);
    if (error) {
      setErro('Não foi possível enviar o e-mail agora. Tente novamente.');
      return;
    }
    setEnviado(true);
  }

  return (
    <AuthScreenFrame title="Recuperar senha" subtitle="Enviamos um link de redefinição para o e-mail cadastrado.">
      {enviado ? (
        <Text style={styles.confirmacao}>
          Se {email || 'o e-mail informado'} estiver cadastrado, você vai receber um link para redefinir a senha em
          instantes.
        </Text>
      ) : (
        <>
          <TextField
            label="E-mail cadastrado"
            value={email}
            onChangeText={setEmail}
            placeholder="voce@globalengenharia.com.br"
            keyboardType="email-address"
            autoComplete="email"
          />
          {erro ? <Text style={styles.erro}>{erro}</Text> : null}
          <PrimaryButton label={enviando ? 'Enviando...' : 'Enviar instruções'} onPress={handleEnviar} disabled={enviando || !email} />
        </>
      )}

      <Pressable onPress={() => router.back()}>
        <Text style={styles.link}>Voltar para o login</Text>
      </Pressable>
    </AuthScreenFrame>
  );
}

const styles = StyleSheet.create({
  confirmacao: { ...typography.body, color: colors.textPrimary },
  erro: { ...typography.caption, color: colors.negative },
  link: { ...typography.caption, color: colors.blue, textAlign: 'center', marginTop: 4 },
});
