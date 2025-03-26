import { Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Switch, TouchableOpacity } from 'react-native';

// Define a type for the task object
interface Task {
  id: string;
  name: string;
  description: string;
  selected: boolean;
}

const AllTasksScreen = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const taskData: Task[] = [
        { id: '1', name: 'Task 1', description: 'Description of task 1', selected: false },
        { id: '2', name: 'Task 2', description: 'Description of task 2', selected: false },
        { id: '3', name: 'Task 3', description: 'Description of task 3', selected: false },
        { id: '4', name: 'Task 1', description: 'Description of task 1', selected: false },
        { id: '5', name: 'Task 2', description: 'Description of task 2', selected: false },
        { id: '6', name: 'Task 3', description: 'Description of task 3', selected: false },
      ];
      setTasks(taskData);
    };

    fetchTasks();
  }, []);

  const toggleCompletion = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, selected: !task.selected } : task
      )
    );
  };

  const selectedTasksCount = tasks.filter(task => task.selected).length;

  const handleSubmit = () => {
    console.log(`${selectedTasksCount} tasks selected!`);
    // Add your submit logic here (e.g., save the state or make an API call)
  };

  const renderItem = ({ item }: { item: Task }) => (
    <View style={styles.taskContainer}>
      <Text style={styles.taskName}>{item.name}</Text>
      <Text style={styles.taskDescription}>{item.description}</Text>
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>{item.selected ? 'Selected' : 'Not Selected'}</Text>
        <Switch
          value={item.selected}
          onValueChange={() => toggleCompletion(item.id)}
          trackColor={{ false: '#ccc', true: '#03A9F4' }}
          thumbColor={item.selected ? '#fff' : '#f4f3f4'}
        />
      </View>
    </View>
  );

  return (
    <>
    <Stack.Screen options={{ title: 'All Tasks' }} />
    


    <View style={styles.container}>
      <Text style={styles.title}>Select Tasks</Text>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.flatListContent}
      />

      {/* Add X Tasks Button */}
      <View style={styles.submitButtonContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Add {selectedTasksCount} tasks</Text>
        </TouchableOpacity>
      </View>
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 0.88,
    paddingTop: 20,
    paddingHorizontal: 16,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  taskContainer: {
    backgroundColor: '#2c3e50',
    marginBottom: 10,
    borderRadius: 8,
    padding: 10,
  },
  taskName: {
    color:'#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskDescription: {
    fontSize: 14,
    color: '#fff',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#888',
  },
  submitButtonContainer: {
    marginTop: 20,
    paddingBottom: 20, // Ensure there's space below the button
  },
  submitButton: {
    backgroundColor: '#03A9F4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  flatListContent: {
    paddingBottom: 80, // Ensure there's space at the bottom for the button
  },
});

export default AllTasksScreen;
