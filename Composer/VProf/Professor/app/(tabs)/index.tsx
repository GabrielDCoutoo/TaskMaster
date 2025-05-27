import { Image, StyleSheet, TouchableOpacity, View, Text, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router'; // Import useRouter
import ParallaxScrollView from '@/components/ParallaxScrollView';
import React, { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';

//  Ter atenção:
//  - Backend_URL
//  - ID do projeto -> app.json/expo-> extra->eas->projectID
const BACKEND_URL = 'http://10.163.235.3:8003';


export default function HomeScreen() {
  const router = useRouter(); // Get the navigation router
  const [expoToken, setExpoToken] = useState('');
  const [status, setStatus] = useState('A iniciar...');
  const [apiKey, setApiKey] = useState('');
  const [pressCount, setPressCount] = useState(0); //só para testar -> o teste seria carregar 5 vezes num botão e ver se recebe notificação após isso



  useEffect(() => {
    console.log("--------------------------------------ATUALIZOU----------------------------------------------------------")
    async function inicializar() {
      await setup();
      //gerarApiKey se não existir
      await gerarApiKey();
  
      if (expoToken && apiKey) {
        //await enviarNotificacao(apiKey, expoToken, 'Olá!', 'Esta é uma notificação de teste'); // SÓ PARA TESTAR
      }
    }
  
    inicializar();


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

  };

  async function enviarNotificacao(apiKey: string, token: string, titulo: string, mensagem: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/send_notification?api_key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_token: token,
          title: titulo,
          message: mensagem,
        }),
      });
      console.log("api_key:", apiKey)
      const data = await response.json();
  
      if (response.ok) {
        console.log('✅ Notificação enviada com sucesso:', data.message);
      } else {
        console.error('❌ Erro ao enviar notificação:', data.detail);
  
        // ⚠️ VERIFICAÇÃO EXTRA: API Key inválida → apaga e gera nova
        if (data.detail === "API Key inválida!") {
          await SecureStore.deleteItemAsync('api_key');
          console.log('🔑 API Key inválida removida. A gerar nova...');
          const novaKey = await gerarApiKey();
          if (novaKey && token) {
            await enviarNotificacao(novaKey, token, titulo, mensagem); // tenta de novo
          }
        }
      }
    } catch (err) {
      console.error('❌ Erro inesperado ao enviar notificação:', err);
    }
  }
  

  //----------------------SÓ-PARA-TESTE------------------
  const handleSecretButtonPress = () => {
    const newCount = pressCount + 1;
    setPressCount(newCount);
  
    if (newCount === 5) {
      // Envia notificação após 5 cliques
      if (apiKey && expoToken) {
        enviarNotificacao(apiKey, expoToken, 'Notificação', 'Carregaste 5 vezes!');
        setPressCount(0); // Reinicia o contador
      } else {
        Alert.alert('Erro', 'API Key ou Token ainda não disponível');
      }
    }
  };
  

  //-------------------AUXILIARES--NOTIFICAÇÕES---------------------------------------------------
  async function setup(): Promise<string> {
    try {
      if (!Device.isDevice) {
        Alert.alert('Erro', 'Notificações só funcionam em dispositivos reais');
        setStatus('Dispositivo não suportado');
        return '';
      }
  
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
  
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
  
      if (finalStatus !== 'granted') {
        Alert.alert('Permissão recusada');
        setStatus('Permissão recusada');
        return '';
      }
  
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
  
      const token = tokenData?.data || '';
      if (token) {
        setExpoToken(token);
        setStatus('Token obtido com sucesso!');
        console.log('Expo Token:', token);
        return token;
      } else {
        setStatus('Falha ao obter token');
        return '';
      }
  
    } catch (err) {
      console.error('Erro ao configurar notificações:', err);
      setStatus('Erro inesperado');
      return '';
    }
  }
  

  //Nesta função devemos guardar as keys para não serem sempre geradas novas
  async function gerarApiKey(): Promise<string> {
    try {
      // Verifica se já existe uma key guardada
      const storedKey = await SecureStore.getItemAsync('api_key');
      if (storedKey) {
        console.log('API Key armazenada:', storedKey);
        
        setApiKey(storedKey);
        return storedKey;
      }
  
      // Se não existir, gera uma nova
      const response = await fetch(`${BACKEND_URL}/generate_api_key`, {
        method: 'POST',
      });
  
      if (!response.ok) {
        throw new Error('Erro ao gerar nova API Key');
      }
  
      const data = await response.json();
      await SecureStore.setItemAsync('api_key', data.api_key); // Guarda a nova key
      setApiKey(data.api_key);
      console.log('🔐 Nova API Key gerada e guardada:', data.api_key);
      return data.api_key;
    } catch (err) {
      console.error('❌ Erro ao obter API Key:', err);
      return '';
    }
  }
  
  
  //--------------------------------------------------------------------------------------------------------
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
    <Text style={styles.title}>Welcome, Teacher 👩‍🏫</Text>
    <Text style={styles.subtitle}>Manage your class easily</Text>
      <View style={styles.container2}>
        
        <TouchableOpacity style={styles.button} onPress={() => router.push('/quests')}>
          <Text style={styles.buttonText}>Create Assignment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/student_quests')}>
          <Text style={styles.buttonText}>View Student Assignments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/github')}>
          <Text style={styles.buttonText}>Check GitHub Contributions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/NFCReader')}> 
          <Text style={styles.buttonText}>Testar NFC</Text>
        </TouchableOpacity>
      </View>
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
    backgroundColor: '#fff', // Ensure this is white
  },
  container2: {
    flex: 1, // Ensures this container takes the remaining space
    marginTop: 20,
    paddingTop: 80,
    paddingHorizontal: 20,
    backgroundColor: '#fff', // White background for this part as well
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
