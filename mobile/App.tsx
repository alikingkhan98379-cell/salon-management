import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { QueueScreen } from './src/screens/QueueScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<'queue' | 'book' | 'staff'>('queue');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      
      {/* Top Mobile Bar */}
      <View style={styles.header}>
        <Text style={styles.brandTitle}>WESTERN BOYS SALON</Text>
        <Text style={styles.tagline}>Mobile Suite • Android &amp; iOS</Text>
      </View>

      {/* Screen Container */}
      <View style={styles.content}>
        {activeTab === 'queue' && <QueueScreen />}
        {activeTab === 'book' && (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderTitle}>Customer Booking</Text>
            <Text style={styles.placeholderSubtitle}>
              Dual-pricing for In-Salon &amp; Doorstep Home Visit is synced with the Supabase backend.
            </Text>
          </View>
        )}
        {activeTab === 'staff' && (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderTitle}>Staff Barber Agenda</Text>
            <Text style={styles.placeholderSubtitle}>
              Restricted barber portal: view assigned clients without access to salon revenues.
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'queue' && styles.activeTabItem]}
          onPress={() => setActiveTab('queue')}
        >
          <Text style={[styles.tabText, activeTab === 'queue' && styles.activeTabText]}>Live Queue</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'book' && styles.activeTabItem]}
          onPress={() => setActiveTab('book')}
        >
          <Text style={[styles.tabText, activeTab === 'book' && styles.activeTabText]}>Book Visit</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'staff' && styles.activeTabItem]}
          onPress={() => setActiveTab('staff')}
        >
          <Text style={[styles.tabText, activeTab === 'staff' && styles.activeTabText]}>Staff Portal</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B0F19' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0B0F19',
  },
  brandTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  tagline: { fontSize: 11, color: '#E5A93C', fontWeight: 'bold', marginTop: 2 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#121826',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabItem: {
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  activeTabText: {
    color: '#E5A93C',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
});
