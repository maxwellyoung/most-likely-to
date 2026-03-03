import { router } from "expo-router";
import { MultiplayerGame } from "@/components/MultiplayerGame";

export default function MultiplayerScreen() {
  return <MultiplayerGame onBack={() => router.replace("/")} />;
}
