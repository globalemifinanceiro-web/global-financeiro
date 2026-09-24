import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 40 }: LogoProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Image source={require('../../assets/brand/logo.png')} style={{ width: size, height: size }} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 8, overflow: 'hidden' },
});
