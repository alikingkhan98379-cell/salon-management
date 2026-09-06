import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Token } from '../types';

const INITIAL_TOKENS: Token[] = [
  {
    id: 'tok-1',
    token_number: 1,
    token_code: 'WBS-01',
    customer_name: 'Rahul Sharma',
    service_name: 'Gentlemen Combo (Hair + Beard)',
    staff_name: 'Farhan Akhtar',
    status: 'serving',
    estimated_wait_minutes: 0,
  },
  {
    id: 'tok-2',
    token_number: 2,
    token_code: 'WBS-02',
    customer_name: 'Aditya Rathore',
    service_name: 'Signature Fade & Scissor Cut',
    staff_name: 'Vikram Singh',
    status: 'waiting',
    estimated_wait_minutes: 15,
  },
  {
    id: 'tok-3',
    token_number: 3,
    token_code: 'WBS-03',
    customer_name: 'Mohit Agarwal',
    service_name: 'Activated Charcoal Deep Cleanse',
    staff_name: 'Sameer Verma',
    status: 'waiting',
    estimated_wait_minutes: 35,
  },
];

export const QueueScreen = () => {
  const [tokens, setTokens] = useState<Token[]>(INITIAL_TOKENS);

  const currentlyServing = tokens.find(t => t.status === 'serving');
  const waitingTokens = tokens.filter(t => t.status === 'waiting');

  const handleCallNext = () => {
    if (waitingTokens.length === 0) {
      Alert.alert('Queue Clear', 'No customers waiting in queue.');
      return;
    }

    const next = waitingTokens[0];
    setTokens(prev => 
      prev.map(t => {
        if (t.status === 'serving') return { ...t, status: 'completed' };
        if (t.id === next.id) return { ...t, status: 'serving', estimated_wait_minutes: 0 };
        return t;
      })
    );

    Alert.alert('Customer Called', `Token #${next.token_code} (${next.customer_name}) called! WhatsApp alert sent.`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Token Station</Text>
      <Text style={styles.subtitle}>Western Boys Salon • Reception Desk</Text>

      {/* Currently Serving Box */}
      <View style={styles.servingCard}>
        <Text style={styles.servingLabel}>NOW SERVING</Text>
        <Text style={styles.tokenNumber}>{currentlyServing ? `#${currentlyServing.token_code}` : '--'}</Text>
        {currentlyServing ? (
          <>
            <Text style={styles.customerName}>{currentlyServing.customer_name}</Text>
            <Text style={styles.serviceName}>{currentlyServing.service_name}</Text>
            <Text style={styles.barberName}>Barber: {currentlyServing.staff_name}</Text>
          </>
        ) : (
          <Text style={styles.emptyText}>No customer currently in chair</Text>
        )}
      </View>

      {/* Call Next Button */}
      <TouchableOpacity 
        style={[styles.callBtn, waitingTokens.length === 0 && styles.disabledBtn]}
        onPress={handleCallNext}
        disabled={waitingTokens.length === 0}
      >
        <Text style={styles.callBtnText}>CALL NEXT CUSTOMER</Text>
      </TouchableOpacity>

      <Text style={styles.queueHeader}>Waiting in Line ({waitingTokens.length})</Text>

      <FlatList
        data={waitingTokens}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.queueItem}>
            <View>
              <Text style={styles.itemCode}>#{item.token_code}</Text>
              <Text style={styles.itemName}>{item.customer_name}</Text>
              <Text style={styles.itemService}>{item.service_name}</Text>
            </View>
            <View style={styles.waitBadge}>
              <Text style={styles.waitText}>~{item.estimated_wait_minutes}m</Text>
              <Text style={styles.posText}>#{index + 1} in line</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', fontFamily: 'sans-serif' },
  subtitle: { fontSize: 12, color: '#E5A93C', marginBottom: 20 },
  servingCard: {
    backgroundColor: '#121826',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5A93C',
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  servingLabel: { fontSize: 12, fontWeight: 'bold', color: '#E5A93C', letterSpacing: 2 },
  tokenNumber: { fontSize: 48, fontWeight: '900', color: '#E5A93C', marginVertical: 8 },
  customerName: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  serviceName: { fontSize: 14, color: '#94A3B8', marginTop: 2 },
  barberName: { fontSize: 12, color: '#E5A93C', marginTop: 4 },
  emptyText: { color: '#64748B', fontSize: 14, marginTop: 8 },
  callBtn: {
    backgroundColor: '#E5A93C',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 25,
  },
  disabledBtn: { backgroundColor: '#1E293B', opacity: 0.6 },
  callBtnText: { color: '#090D16', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  queueHeader: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  queueItem: {
    backgroundColor: '#151C2C',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#232E47',
  },
  itemCode: { fontSize: 16, fontWeight: 'bold', color: '#E5A93C' },
  itemName: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', marginTop: 2 },
  itemService: { fontSize: 12, color: '#94A3B8' },
  waitBadge: { alignItems: 'flex-end' },
  waitText: { fontSize: 14, fontWeight: 'bold', color: '#E5A93C' },
  posText: { fontSize: 10, color: '#64748B' },
});
