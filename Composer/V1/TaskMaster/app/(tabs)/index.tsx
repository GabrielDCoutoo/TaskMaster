import { Image, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useRouter } from 'expo-router'; // Import useRouter
import ParallaxScrollView from '@/components/ParallaxScrollView';
import React from 'react';


export default function HomeScreen() {
  const router = useRouter(); // Get the navigation router

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
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '90%',
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


