import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AuthScreenFrame } from '@/components/auth/AuthScreenFrame';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { useSessionStore } from '@/stores/useSessionStore';
import { colors, typography } from '@/theme';

export default function LoginScreen() {
  const entrar = useSessionStore((state) => state.entrar);
  const carregandoLogin = useSessionStore((state) => state.carregandoLogin);
  const erroLogin = useSessionStore((state) => state.erroLogin);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  async function handleEntrar() {
    const ok = await entrar(email.trim(), senha);
    if (ok) {
      router.replace('/dashboard');
    }
  }

  return (
    <AuthScreenFrame title="Entrar">
      <TextField
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        placeholder="voce@globalengenharia.com.br"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="username"
      />
      <TextField
        label="Senha"
        value={senha}
        onChangeText={setSenha}
        placeholder="Sua senha"
        secureTextEntry
        autoComplete="password"
        textContentType="password"
      />

      {erroLogin ? <Text style={styles.erro}>{erroLogin}</Text> : null}

      <PrimaryButton
        label={carregandoLogin ? 'Entrando...' : 'Entrar'}
        onPress={handleEntrar}
        disabled={carregandoLogin || !email || !senha}
      />

      <Pressable onPress={() => router.push('/recuperar-senha')}>
        <Text style={styles.link}>Esqueci minha senha</Text>
      </Pressable>
    </AuthScreenFrame>
  );
}

const styles = StyleSheet.create({
  erro: { ...typography.caption, color: colors.negative },
  link: { ...typography.caption, color: colors.blue, textAlign: 'center', marginTop: 4 },
});
