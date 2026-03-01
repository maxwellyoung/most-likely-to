import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";

interface Question {
  id: number;
  question_text: string;
}

function generateQuestions(count: number): Question[] {
  const questions: Question[] = [];
  const topics = [
    "History",
    "Science",
    "Geography",
    "Literature",
    "Art",
    "Music",
    "Sports",
    "Movies",
    "Technology",
    "Food",
    "Animals",
    "Politics",
    "Mathematics",
    "Language",
    "Astronomy",
    "Biology",
    "Chemistry",
    "Physics",
    "Economics",
    "Philosophy",
  ];

  for (let i = 1; i <= count; i++) {
    const topic = topics[Math.floor(Math.random() * topics.length)];
    questions.push({
      id: i,
      question_text: `Question ${i} about ${topic}?`,
    });
  }

  return questions;
}

const sampleQuestions: Question[] = generateQuestions(1000);

export default function QuestionList() {
  return (
    <FlatList
      data={sampleQuestions}
      renderItem={({ item }) => (
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{item.question_text}</Text>
        </View>
      )}
      keyExtractor={(item) => item.id.toString()}
    />
  );
}

const styles = StyleSheet.create({
  questionContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  questionText: {
    fontSize: 16,
  },
});
