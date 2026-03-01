import { StyleSheet } from "react-native";
import { PersonalizedPartyGame } from "@/components/PersonalizedPartyGame";
import { ThemedView } from "@/components/ThemedView";

export default function HomeScreen() {
  return (
    <ThemedView
      style={styles.container}
      accessibilityLabel="Gambit party game"
    >
      <PersonalizedPartyGame />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7", // Light gray background
  },
});
