import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, Dimensions } from "react-native";
import { router } from 'expo-router';
import Svg, { Line } from 'react-native-svg';
import Colors from '@/constants/Colors';

const CIRCLE_SIZE = 40;
const FONT_SIZE = 20;
const { width, height } = Dimensions.get('window');

// Add these constants for layout
const PADDING = 20;
const GAME_AREA_HEIGHT = 500;
const SAFE_AREA = {
  top: PADDING,
  bottom: GAME_AREA_HEIGHT - PADDING,
  left: PADDING,
  right: width - PADDING
};

interface Point {
  id: string;
  x: number;
  y: boolean;
  isSelected: boolean;
}

interface Line {
  start: Point;
  end: Point;
}

export default function TrailMakingTest() {
  const [points, setPoints] = useState<Point[]>([
    { id: "1", x: 50, y: 100, isSelected: false },
    { id: "A", x: 200, y: 150, isSelected: false },
    { id: "2", x: 80, y: 200, isSelected: false },
    { id: "B", x: 250, y: 250, isSelected: false },
    { id: "3", x: 120, y: 300, isSelected: false },
    { id: "C", x: 280, y: 350, isSelected: false },
    { id: "4", x: 160, y: 400, isSelected: false },
    { id: "D", x: 300, y: 450, isSelected: false },
    { id: "5", x: 200, y: 350, isSelected: false },
    { id: "E", x: 320, y: 400, isSelected: false },
  ]);
  
  const [sequence, setSequence] = useState<string[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const correctSequence = ["1", "A", "2", "B", "3", "C", "4", "D", "5", "E"];
  const [isCompleted, setIsCompleted] = useState(false);

  const validateSequence = (newSequence: string[]): boolean => {
    const expectedSequence = ["1", "A", "2", "B", "3", "C", "4", "D", "5", "E"];
    return newSequence.join('') === expectedSequence.join('');
  };

  const validateConnection = (startPoint: Point, endPoint: Point): boolean => {
    const startIndex = correctSequence.indexOf(startPoint.id);
    const endIndex = correctSequence.indexOf(endPoint.id);
    
    // Check if points are consecutive in sequence
    return startIndex + 1 === endIndex;
  };

  const handlePress = (point: Point) => {
    if (isCompleted) return;

    // If point is already selected, disconnect it and following points
    if (point.isSelected) {
      const index = sequence.indexOf(point.id);
      if (index !== -1) {
        const newSequence = sequence.slice(0, index);
        setSequence(newSequence);
        setLines(lines.slice(0, index));
        setPoints(points.map(p => ({
          ...p,
          isSelected: newSequence.includes(p.id)
        })));
      }
      return;
    }

    // Add new connection regardless of correctness
    const nextIndex = sequence.length;
    const newSequence = [...sequence, point.id];

    // If this is not the first point, create a line from previous point
    if (nextIndex > 0) {
      const previousPoint = points.find(p => p.id === sequence[nextIndex - 1])!;
      setLines([...lines, { start: previousPoint, end: point }]);
    }

    // Add to sequence and mark as selected
    setSequence(newSequence);
    setPoints(points.map(p => 
      p.id === point.id ? { ...p, isSelected: true } : p
    ));

    // Check if test is complete
    if (newSequence.length === correctSequence.length) {
      setIsCompleted(true);
      const isCorrect = validateSequence(newSequence);
      
      Alert.alert(
        "Test Complete",
        "You've completed the trail making test",
        [
          {
            text: "Continue",
            onPress: () => router.push({
              pathname: "/(moca)/visuospatial_clock",
              params: { score: isCorrect ? 1 : 0 }
            })
          }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        Connect numbers and letters in order: 1-A-2-B-3-C-4-D-5-E{'\n'}
        <Text style={styles.subInstruction}>
          (Tap a dot again to disconnect)
        </Text>
      </Text>
      
      <View style={styles.gameContainer}>
        <View style={styles.gameArea}>
          <Svg style={StyleSheet.absoluteFill}>
            {/* Draw completed lines */}
            {lines.map((line, index) => (
              <Line
                key={index}
                x1={line.start.x + CIRCLE_SIZE/2}
                y1={line.start.y + CIRCLE_SIZE/2}
                x2={line.end.x + CIRCLE_SIZE/2}
                y2={line.end.y + CIRCLE_SIZE/2}
                stroke="#007AFF"
                strokeWidth="2"
              />
            ))}
          </Svg>

          {points.map((point) => (
            <Pressable
              key={point.id}
              style={[
                styles.circle,
                { left: point.x, top: point.y },
                point.isSelected && styles.selectedCircle
              ]}
              onPress={() => handlePress(point)}
            >
              <Text style={[
                styles.circleText,
                point.isSelected && styles.selectedText
              ]}>
                {point.id}
              </Text>
            </Pressable>
          ))}
          
          {sequence.length > 0 && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Progress: {sequence.join(" → ")}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  gameContainer: {
    height: GAME_AREA_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    overflow: 'hidden',
    marginBottom: 20,
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    padding: PADDING,
  },
  circle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircle: {
    backgroundColor: '#007AFF',
  },
  circleText: {
    fontSize: FONT_SIZE,
    color: '#000',
    fontWeight: '600',
  },
  selectedText: {
    color: '#fff',
  },
  progressContainer: {
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
  },
  progressText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#000',
  },
  subInstruction: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
});
