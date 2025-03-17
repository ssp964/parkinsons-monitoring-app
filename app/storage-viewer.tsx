import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function StorageViewer() {
  const [storageData, setStorageData] = useState<Array<[string, string | null]>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStorageData = async () => {
    try {
      setIsLoading(true);
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      setStorageData(items);
    } catch (error) {
      console.error('Error loading storage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStorageData();
  }, []);

  const renderValue = (value: string | null) => {
    if (!value) return 'null';
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Storage Viewer</Text>
        <Pressable 
          style={styles.refreshButton}
          onPress={loadStorageData}
        >
          <Ionicons name="refresh" size={24} color={Colors.textLight} />
        </Pressable>
      </View>

      {isLoading ? (
        <Text style={styles.loadingText}>Loading storage data...</Text>
      ) : (
        <ScrollView style={styles.scrollView}>
          {storageData.map(([key, value], index) => (
            <View key={index} style={styles.item}>
              <Text style={styles.key}>{key}</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.value}>
                  {renderValue(value)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textLight,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    color: Colors.textLight,
    fontSize: 16,
    textAlign: 'center',
  },
  item: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  key: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  valueContainer: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 4,
  },
  value: {
    color: Colors.textLight,
    fontSize: 14,
    fontFamily: 'monospace',
  },
});