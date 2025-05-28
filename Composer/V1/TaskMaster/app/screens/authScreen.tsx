// app/screens/authScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { router } from 'expo-router';
import {
  API_BASE_URL,
  GITHUB_CLIENT_ID,
  GITHUB_REDIRECT_URI,
} from '../../constants/constants';

WebBrowser.maybeCompleteAuthSession();

type AuthScreenProps = {
  onLogin: () => void;
};

interface GitHubUser {
  login: string;
  avatar_url: string;
  name?: string;
  email?: string;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [userInfo, setUserInfo] = useState<GitHubUser | null>(null);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GITHUB_CLIENT_ID,
      scopes: ['read:user', 'user:email'],
      redirectUri: GITHUB_REDIRECT_URI,
    },
    { authorizationEndpoint: 'https://github.com/login/oauth/authorize' }
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      exchangeCodeForTokenBackend(code);
    }
  }, [response]);

  async function exchangeCodeForTokenBackend(code: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/v1/auth/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri: GITHUB_REDIRECT_URI }),
      });

      const { access_token } = await res.json();
      fetchGitHubUser(access_token);
    } catch (err) {
      console.error('Erro ao trocar código no backend:', err);
    }
  }

  async function fetchGitHubUser(token: string) {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setUserInfo(data);

      const usersRes = await fetch(`${API_BASE_URL}/v1/users/`);
      const users = await usersRes.json();

      const userExists = users.ranking.some(
        (user: { name: string; email: string }) =>
          user.name === data.name && user.email === data.email
      );

      if (!userExists) {
        await fetch(`${API_BASE_URL}/v1/users/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.name, email: data.email }),
        });
      }

      setTimeout(() => {
        router.push({
          pathname: '/(tabs)/profile',
          params: {
            login: data.login,
            avatar_url: data.avatar_url,
            email: data.email,
            name: data.name,
          },
        });
      }, 500);

      onLogin();
    } catch (error) {
      console.error('Erro ao obter utilizador:', error);
    }
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>TaskMaster</Text>

      {userInfo && <Text style={styles.userText}>Bem-vindo, {userInfo.login}!</Text>}

      <TouchableOpacity style={styles.button2} onPress={() => promptAsync()}>
        <Text style={styles.buttonText2}>Login com GitHub</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button2} onPress={onLogin}>
        <Text style={styles.buttonText2}>Login com UA</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  userText: { color: '#fff', fontSize: 18, marginBottom: 20 },
  button2: { backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, marginBottom: 15 },
  buttonText2: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  logo: { width: 150, height: 150, marginBottom: 20 },
});

export default AuthScreen;
