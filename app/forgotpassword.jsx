import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');

  const handleResetPassword = () => {
    if (!email.trim()) {
      Alert.alert('error', 'please enter your email.');
    } else {
      Alert.alert('success', 'reset link sent to your email.');
      router.push('/login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>forgot password</Text>
      <Text style={styles.subtitle}>enter your email to receive reset instructions</Text>

      <TextInput
        placeholder="email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>send reset link</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.backText}>go back to login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#E8D5F2' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 5, textTransform: 'lowercase' },
  subtitle: { fontSize: 16, color: 'gray', marginBottom: 20, textTransform: 'lowercase' },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 50,
    marginBottom: 20,
    textTransform: 'lowercase',
  },
  button: {
    backgroundColor: '#5e0577ff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 16, textTransform: 'lowercase' },
  backText: { color: 'gray', textAlign: 'center', textTransform: 'lowercase' },
});
