// utils/notificacoes.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';

const BACKEND_URL = 'http://192.168.0.11:8000';

export async function setupNotificacoes(setExpoToken: (token: string) => void, setStatus: (status: string) => void): Promise<string> {
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

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    } else {
      setStatus('Falha ao obter token');
    }

    return token;
  } catch (err) {
    console.error('Erro ao configurar notificações:', err);
    setStatus('Erro inesperado');
    return '';
  }
}

export async function gerarApiKey(setApiKey: (apiKey: string) => void): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/generate_api_key`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Erro ao gerar API Key');
    }

    const data = await response.json();
    setApiKey(data.api_key);
    console.log('API Key gerada:', data.api_key);
    return data.api_key;
  } catch (err) {
    console.error('Erro ao obter API Key:', err);
    return '';
  }
}

export async function enviarNotificacao(apiKey: string, token: string, titulo: string, mensagem: string) {
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

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Notificação enviada com sucesso:', data.message);
    } else {
      console.error('❌ Erro ao enviar notificação:', data.detail);
    }
  } catch (err) {
    console.error('❌ Erro inesperado ao enviar notificação:', err);
  }
}
