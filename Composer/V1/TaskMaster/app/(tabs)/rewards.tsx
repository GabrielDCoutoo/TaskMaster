import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const BACKEND_URL = 'http://10.236.227.2:8002'; // replace with your backend IP
const api_key = "e93ab6df869a0d1a3c86eeb47e54e52daa7aad097203a340bdf8d0c25fa6fca0"; // replace with your API key
// deve ser substituido por um fetch GET para o backend e obter a api key

type Reward = {
  id: string;
  title: string;
  progress: number;
  notifications: number;
  description: string;
};

const initialRewards: Reward[] = [
  { id: '1', title: 'Tipo/UC 1', progress: 1, notifications: 0, description: 'You can now redeem: extra 48h to deliver final project' },
  { id: '2', title: 'Tipo/UC 2', progress: 0.55, notifications: 1, description: 'This reward is halfway done.' },
  { id: '3', title: 'Tipo/UC 3', progress: 0.15, notifications: 3, description: 'This reward is just starting.' },
  { id: '4', title: 'Tipo/UC 4', progress: 1, notifications: 0, description: 'You can now redeem: 10% extra credit on your finals grade' },
  { id: '5', title: 'Tipo/UC 5', progress: 0.9, notifications: 0, description: 'You are very close!' },
];

const RewardsScreen = () => {
  const [expandedReward, setExpandedReward] = useState<string | null>(null);
  const [expoToken, setExpoToken] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [rewards, setRewards] = useState<Reward[]>(initialRewards);

  useEffect(() => {
    async function setup() {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        setExpoToken(tokenData.data);
      }

      try {
        setApiKey(api_key);
      } catch (err) {
        console.error('Erro ao obter API Key:', err);
      }
    }

    setup();
  }, []);

  const toggleExpand = (rewardId: string) => {
    setExpandedReward(expandedReward === rewardId ? null : rewardId);
  };

  const enviarNotificacao = async (apiKey: string, token: string, titulo: string, mensagem: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/send_notification?api_key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_token: token,
          title: titulo,
          message: mensagem,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('✅ Notificação enviada com sucesso:', data.message);
      } else {
        console.error('❌ Erro ao enviar notificação:', data.detail);
      }
    } catch (err) {
      console.error('❌ Erro inesperado ao enviar notificação:', err);
    }
  };

  const redeemReward = async (rewardTitle: string) => {
    if (apiKey && expoToken) {
      await enviarNotificacao(apiKey, expoToken, '🎉 Reward Redeemed!', `You redeemed: ${rewardTitle}`);
    } else {
      Alert.alert('Aviso', 'API Key ou Token não estão disponíveis');
    }
  };

  const toggleProgress = (rewardId: string) => {
    setRewards((prevRewards) =>
      prevRewards.map((r) =>
        r.id === rewardId
          ? {
              ...r,
              progress: r.progress === 1 ? 0.5 : 1,
            }
          : r
      )
    );
  };

  const renderRewardItem = ({ item }: { item: Reward }) => (
    <View style={styles.rewardCard}>
      <TouchableOpacity onPress={() => toggleExpand(item.id)}>
        <View style={styles.rewardHeader}>
          <Text style={styles.rewardTitle}>{item.title}</Text>
          {item.notifications > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{item.notifications}</Text>
            </View>
          )}
        </View>
        <ProgressBar
          progress={item.progress}
          color={item.progress === 1 ? '#FFD700' : '#4CAF50'}
          style={styles.progressBar}
        />
      </TouchableOpacity>

      {expandedReward === item.id && (
        <View style={styles.expandedContent}>
          <Text style={styles.description}>{item.description}</Text>
          <TouchableOpacity style={styles.toggleButton} onPress={() => toggleProgress(item.id)}>
            <Text style={styles.toggleText}>
              {item.progress === 1 ? 'Mark as Incomplete' : 'Mark as Complete'}
            </Text>
          </TouchableOpacity>
          {item.progress === 1 && (
            <TouchableOpacity style={styles.redeemButton} onPress={() => redeemReward(item.title)}>
              <Text style={styles.redeemText}>Redeem</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const toCompleteRewards = rewards.filter((reward) => reward.progress < 1);
  const completedRewards = rewards.filter((reward) => reward.progress === 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rewards</Text>

      <Text style={styles.sectionTitle}>To Complete</Text>
      <FlatList data={toCompleteRewards} keyExtractor={(item) => item.id} renderItem={renderRewardItem} />

      <Text style={styles.sectionTitle}>Completed</Text>
      <FlatList data={completedRewards} keyExtractor={(item) => item.id} renderItem={renderRewardItem} />
    </View>
  );
};

export default RewardsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, backgroundColor: '#f2f2f2' },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginLeft: 16, marginTop: 20 },
  rewardCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
  },
  rewardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rewardTitle: { fontSize: 18, fontWeight: 'bold' },
  notificationBadge: {
    backgroundColor: 'red',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  notificationText: { color: '#fff', fontWeight: 'bold' },
  progressBar: { marginTop: 10, height: 10, borderRadius: 5 },
  expandedContent: { marginTop: 10 },
  description: { fontSize: 14, color: '#333', marginBottom: 10 },
  redeemButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  redeemText: { color: '#fff', fontWeight: 'bold' },
  toggleButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  toggleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
