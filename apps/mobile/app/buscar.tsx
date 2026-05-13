import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SearchScreen() {
  const { q } = useLocalSearchParams<{ q?: string }>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Resultados para “{q ?? ""}”</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Aún no hay resultados conectados a la API.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafafa" },
  container: { padding: 20 },
  back: { color: "#737373", fontSize: 14 },
  title: { fontSize: 22, fontWeight: "700", marginTop: 16 },
  empty: {
    marginTop: 32,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#d4d4d4",
    borderRadius: 10,
    padding: 24,
    alignItems: "center",
  },
  emptyText: { color: "#737373", textAlign: "center" },
});
