import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { ProgressBar, Button } from 'react-native-paper';

const rewards = [
  { id: '1', title: 'Tipo/UC 1', progress: 1, notifications: 0, description: 'You can now redeem: extra 48h to deliver final project' },
  { id: '2', title: 'Tipo/UC 2', progress: 0.55, notifications: 1, description: 'This reward is halfway done.' },
  { id: '3', title: 'Tipo/UC 3', progress: 0.15, notifications: 3, description: 'This reward is just starting.' },
  { id: '4', title: 'Tipo/UC 4', progress: 1, notifications: 0, description: 'You can now redeem: 10% extra credit on your finals grade' },
  { id: '5', title: 'Tipo/UC 5', progress: 0.9, notifications: 0, description: 'You are very close!' },
];

const RewardsScreen = () => {
  const [expandedReward, setExpandedReward] = useState<string | null>(null);

  const toggleExpand = (rewardId: string) => {
    setExpandedReward(expandedReward === rewardId ? null : rewardId);
  };

  const redeemReward = (rewardTitle: string) => {
    Alert.alert('Reward Redeemed', `You have successfully redeemed: ${rewardTitle}`);
  };

  const completedRewards = rewards.filter((reward) => reward.progress === 1);
  const toCompleteRewards = rewards.filter((reward) => reward.progress < 1);

  const renderRewardItem = ({ item }: { item: typeof rewards[number] }) => (
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
        <ProgressBar progress={item.progress} color={item.progress === 1 ? '#FFD700' : '#4CAF50'} style={styles.progressBar} />
      </TouchableOpacity>

      {/* Dropdown Content */}
      {expandedReward === item.id && (
        <View style={styles.expandedContent}>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.progressText}>Progress: {(item.progress * 100).toFixed(0)}%</Text>

          {/* Show Redeem Button for Completed Rewards */}
          {item.progress === 1 && (
            <Button mode="contained" onPress={() => redeemReward(item.title)} style={styles.redeemButton}>
              Redeem Reward
            </Button>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rewards</Text>

      {/* To Complete Rewards */}
      <Text style={styles.sectionTitle}>To Complete</Text>
      <FlatList data={toCompleteRewards} keyExtractor={(item) => item.id} renderItem={renderRewardItem} />

      {/* Completed Rewards */}
      <Text style={styles.sectionTitle}>Completed</Text>
      <FlatList data={completedRewards} keyExtractor={(item) => item.id} renderItem={renderRewardItem} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
  rewardCard: {
    backgroundColor: '#C6C2BF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardTitle: {
    fontSize: 18,
    color: '#fff',
  },
  notificationBadge: {
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  notificationText: {
    color: 'white',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  expandedContent: {
    marginTop: 10,
    backgroundColor: '#EDEDED',
    padding: 10,
    borderRadius: 5,
  },
  description: {
    fontSize: 16,
    color: '#333',
  },
  progressText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  redeemButton: {
    marginTop: 10,
    backgroundColor: '#FFD700',
  },
});

export default RewardsScreen;
