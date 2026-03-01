import React, { forwardRef } from "react";
import { View, ViewProps } from "react-native";
import { useThemeColor } from "../hooks/useThemeColor";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export const ThemedView = forwardRef<View, ThemedViewProps>(
  ({ style, lightColor, darkColor, ...otherProps }, ref) => {
    const backgroundColor = useThemeColor(
      { light: lightColor, dark: darkColor },
      "background"
    );

    return (
      <View ref={ref} style={[{ backgroundColor }, style]} {...otherProps} />
    );
  }
);

// Add a display name for better debugging
ThemedView.displayName = "ThemedView";
