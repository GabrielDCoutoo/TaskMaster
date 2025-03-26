import { Image, StyleSheet, TouchableOpacity, View, Text, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router'; // Import useRouter
import ParallaxScrollView from '@/components/ParallaxScrollView';
import React, { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

export default function HomeScreen() {
  const router = useRouter(); // Get the navigation router
  const [expoToken, setExpoToken] = useState('');
  const [status, setStatus] = useState('A iniciar...');

  useEffect(() => {
    setup();

    // 🔔 Listener para notificação recebida com a app aberta
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      Alert.alert(
        '📬 Notificação Recebida',
        `Título: ${notification.request.content.title}\nMensagem: ${notification.request.content.body}`
      );
    });

    return () => {
      subscription.remove(); // Limpa o listener ao sair
    };
  }, []);

  // Function to handle the API request using fetch
  const handleApiRequest = async () => {
    try {
      const response = await fetch('http://192.168.1.190:8000/generate_api_key', {
        method: 'POST', // HTTP method
        headers: {
          'Content-Type': 'application/json', // Indicate that we're sending JSON
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json(); // Parse the JSON response
      console.log('Generated API Key:', data.api_key);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error generating API key:', error.message);
      } else {
        console.error('An unknown error occurred:', error);
      }
    }
  };

  async function setup() {
    try {
      if (!Device.isDevice) {
        Alert.alert('Erro', 'Notificações só funcionam em dispositivos reais');
        setStatus('Dispositivo não suportado');
        return;
      }

      // 👉 Pedir permissões
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Permissão recusada');
        setStatus('Permissão recusada');
        return;
      }

      // 👉 Obter token Expo
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      const token = tokenData?.data || '';
      if (token) {
        setExpoToken(token);
        setStatus('Token obtido com sucesso!');
        console.log('Expo Token:', token);
      } else {
        setStatus('Falha ao obter token');
      }

      // 🔧 Configurar canal Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    } catch (err) {
      console.error('Erro ao configurar notificações:', err);
      setStatus('Erro inesperado');
    }
  }

  
  

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: 'transparent', dark: 'transparent' }}
      headerImage={<Image source={require('@/assets/images/header.png')} style={styles.reactLogo} />}>
      <View style={styles.container}>
        <View style={styles.buttonGrid}>
          <TouchableOpacity style={styles.button} onPress={handleApiRequest}>
            <Image source={require('@/assets/images/completed_tasks.png')} style={styles.buttonImage} />
            <Text style={styles.buttonText}>API Request</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/screens/selectTasksScreen')}>
            <Image source={require('@/assets/images/list_of_tasks.png')} style={styles.buttonImage} />
            <Text style={styles.buttonText}>All Tasks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/screens/selectTasksScreen')}>
            <Image source={require('@/assets/images/select_tasks.png')} style={styles.buttonImage} />
            <Text style={styles.buttonText}>Select Tasks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/screens/githubScreen')}>
            <Image source={require('@/assets/images/github.png')} style={styles.buttonImage} />
            <Text style={styles.buttonText}>GitHub</Text>
          </TouchableOpacity>
          <Text style={styles.label}>Token do Dispositivo:</Text>
            <Text style={styles.code}>
              {expoToken || 'A obter token...'}
            </Text>
        </View>
      </View>
    </ParallaxScrollView>
    
  );
}

const styles = StyleSheet.create({
  reactLogo: {
    height: 150,
    width: 420,
    bottom: 70,
    top: 50,
    left: 0,
    position: 'absolute',
    backgroundColor: '#121212',
  },
  container: {
    flex: 0.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '90%',
  },
  code: {
    fontSize: 14,
    color: '#333',
    backgroundColor: '#eaeaea',
    padding: 8,
    borderRadius: 5,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#03A9F4',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    width: '48%',
    marginBottom: 10,
    marginTop: 30,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  buttonImage: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
});


