import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ViewStyle,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

interface SelectOption<T extends string> {
  label: string;
  value: T;
}

interface SelectProps<T extends string> {
  options: SelectOption<T>[];
  onValueChange: (value: T) => void;
  placeholder?: string;
  value: T;
  containerStyle?: ViewStyle;
}

export function Select<T extends string>({
  options,
  onValueChange,
  placeholder,
  value,
  containerStyle,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (selectedValue: T) => {
    onValueChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <View style={containerStyle}>
      <TouchableOpacity style={styles.select} onPress={() => setIsOpen(true)}>
        <ThemedText style={styles.selectText}>
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
        </ThemedText>
        <Ionicons name="chevron-down" size={20} color="#8E8E93" />
      </TouchableOpacity>
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <BlurView intensity={10} style={styles.modalOverlay}>
          <ThemedView style={styles.optionsContainer}>
            <FlatList
              data={options}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleSelect(item.value)}
                >
                  <ThemedText
                    style={[
                      styles.optionText,
                      item.value === value && styles.selectedOptionText,
                    ]}
                  >
                    {item.label}
                  </ThemedText>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.value}
            />
          </ThemedView>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectText: {
    fontSize: 18,
    color: "#000000",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  optionsContainer: {
    width: "80%",
    maxHeight: "70%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  optionText: {
    fontSize: 18,
    color: "#000000",
  },
  selectedOptionText: {
    color: "#007AFF",
    fontWeight: "600",
  },
});
