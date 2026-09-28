import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTaxStore } from '@/stores/taxStore';

const ScenariosScreen: React.FC<any> = ({ navigation }) => {
  const scenarios = useTaxStore((state) => state.scenarios);
  const deleteScenario = useTaxStore((state) => state.deleteScenario);
  const setCurrentScenario = useTaxStore((state) => state.setCurrentScenario);

  const handleDeleteScenario = (id: string) => {
    Alert.alert(
      'Delete Scenario',
      'Are you sure you want to delete this scenario?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: () => {
            deleteScenario(id);
            Alert.alert('Success', 'Scenario deleted');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {scenarios.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={48} color="#999" />
          <Text style={styles.emptyText}>No scenarios yet</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateScenario')}
          >
            <Text style={styles.createButtonText}>Create First Scenario</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Tax Scenarios</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CreateScenario')}>
              <Feather name="plus" size={24} color="#3b82f6" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={scenarios}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => {
                  setCurrentScenario(item);
                  navigation.navigate('ScenarioDetail', {
                    scenarioId: item.id,
                  });
                }}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardDescription}>
                    {item.description}
                  </Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.metaText}>FY: {item.financialYear}</Text>
                    <Text style={styles.metaText}>{item.status}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteScenario(item.id)}
                  style={styles.deleteButton}
                >
                  <Feather name="trash-2" size={18} color="#ef4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            scrollEnabled={true}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  cardDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  metaText: {
    fontSize: 11,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
});

export default ScenariosScreen;
