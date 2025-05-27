import React, { useEffect, useState } from 'react';
import {SafeAreaView,Text,Button,StyleSheet,Alert,} from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

// Inicia o NFC
NfcManager.start();

export default function NFCReader() {
  const [status, setStatus] = useState("Reach student card");
  const backendUrl = 'https://2b2b-87-196-80-15.ngrok-free.app/nfc';

  async function readNFC() {
    try {
      const isSupported = await NfcManager.isSupported();
      if (!isSupported) {
        setStatus(":x: NFC not supported");
        return;
      }

      await NfcManager.requestTechnology(NfcTech.NfcA);

      const tag = await NfcManager.getTag();
      console.log("Tag lida:", tag);

      if (!tag || !tag.id) {
        setStatus(":warning: it was not possible to read tag");
        return;
      }
      const identifier = tag.id;

      // Converte o ID para hexadecimal (com ':' entre bytes)
      const tagId = identifier.match(/.{1,2}/g)?.join(':') ?? identifier;

      setStatus(`✅ Tag lida: ${tagId}`);

      // Envia para o backend
      await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_id: tagId }),
      });

    } catch (ex) {
      console.warn('Erro:', ex);
      setStatus(':x: Error reading the tag');
    } finally {
      NfcManager.cancelTechnologyRequest();
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.status}>{status}</Text>
      <Button title="Register student presence" color={"#4CAF50"} onPress={readNFC} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  status: {
    color: 'black',
    marginBottom: 20,
    fontSize: 16,
    
  },
});