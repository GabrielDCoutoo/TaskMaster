import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { Alert } from 'react-native';
import { router } from 'expo-router';


NfcManager.start();

const ProfileScreen = () => {
  // Function to detect NFC tags
  const handleNFCScan = async () => {
    try {
      console.log("Scanning for NFC...");
      await NfcManager.requestTechnology(NfcTech.Ndef);
      
      const tag = await NfcManager.getTag();
      
      if (!tag) {
        Alert.alert("NFC Error", "No NFC tag detected. Try again.");
        return;
      }
  
      console.log("NFC Tag Detected:", tag);
      Alert.alert("NFC Detected", JSON.stringify(tag));
  
    } catch (error) {
      console.warn("NFC Error:", error);
      Alert.alert("NFC Error", "Failed to read NFC tag.");
    } finally {
      await NfcManager.cancelTechnologyRequest();
    }
  };
  

  const handleLogout = () => {
    console.log('Logout pressed');
  };
  const handleRanking = () => {
    console.log('Ranking pressed');
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/avatar.jpg')}
        style={styles.avatar}
      />

      <Text style={styles.name}>John Doe</Text>
      <Text style={styles.email}>johndoe@example.com</Text>


      <TouchableOpacity style={styles.button2} onPress={() => router.push('/screens/rankingScreen')}>
        <MaterialCommunityIcons name="crown" size={20} color="white" />
        <Text style={styles.buttonText2}>Ranking</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button2} onPress={handleNFCScan}>
        <MaterialCommunityIcons name="cellphone-nfc" size={20} color="white" />
        <Text style={styles.buttonText2}>NFC</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Icon name="logout" size={20} color="#fff" style={styles.icon} />
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212', // Dark mode background
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 16,
    color: '#bbb',
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E63946',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    marginLeft: 8,
  },
  icon: {
    marginRight: 5,
  },
  button2: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0087bd',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText2: {
    fontSize: 18,
    color: '#fff',
    marginLeft: 8,
  },
});

export default ProfileScreen;
