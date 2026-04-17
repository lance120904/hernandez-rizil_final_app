import React from "react";
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from "react-native";

// Props type
type HomePageProps = {
  message: string;
};

export default function HomePage({ message }: HomePageProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.card}>
        <Text style={styles.title}>Welcome 👋</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a", // dark background
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "90%", // responsive for iPhone 12 & Samsung
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#1e293b",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    alignItems: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#38bdf8", // light blue
    marginBottom: 10,
  },

  message: {
    fontSize: 16,
    color: "#e2e8f0",
    textAlign: "center",
  },
});