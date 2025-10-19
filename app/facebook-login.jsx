import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FacebookLogin() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Facebook Login - Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0E6FA',
  },
  text: {
    fontSize: 18,
    color: '#9B70D8',
    fontWeight: '600',
  },
});

