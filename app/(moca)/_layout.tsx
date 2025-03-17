import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';

export default function MoCALayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen 
        name="introduction"
        options={{ 
          title: 'MoCA Test',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="naming"
        options={{ 
          title: 'Naming Test',
          headerBackTitle: 'Back',
          gestureEnabled: true
        }} 
      />
      <Stack.Screen 
        name="trailmaking" 
        options={{ title: 'Trail Making' }} 
      />
      <Stack.Screen 
        name="visuospatial_clock" 
        options={{ title: 'Visuospatial Clock Test' }} 
      />
      <Stack.Screen 
        name="attention" 
        options={{ title: 'Attention' }} 
      />
      <Stack.Screen 
        name="attention_bs" 
        options={{ title: 'Attention Backward Span' }} 
      />
      <Stack.Screen 
        name="sentence_repetition" 
        options={{ title: 'Sentence Repetition' }} 
      />
      <Stack.Screen 
        name="delayed_recall" 
        options={{ title: 'Delayed Recall' }} 
      />
      <Stack.Screen 
        name="language" 
        options={{ title: 'Language' }} 
      />
      <Stack.Screen 
        name="abstraction" 
        options={{ title: 'Abstraction' }} 
      />
      <Stack.Screen 
        name="memory" 
        options={{ title: 'Delayed Recall' }} 
      />
      <Stack.Screen 
        name="orientation" 
        options={{ title: 'Orientation' }} 
      />
      <Stack.Screen 
        name="results" 
        options={{ title: 'Test Results' }} 
      />
      <Stack.Screen 
        name="finish" 
        options={{ 
          title: 'Complete Test',
          headerBackVisible: false 
        }} 
      />
    </Stack>
  );
}