import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

const CHAINS = [
  "Jumbo",
  "Líder",
  "Santa Isabel",
  "Tottus",
  "Unimarc",
  "Cruz Verde",
  "Salcobrand",
  "Ahumada",
];

export default function HomeScreen() {
  const [query, setQuery] = useState("");

  const onSearch = () => {
    if (!query.trim()) return;
    router.push({ pathname: "/buscar", params: { q: query.trim() } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Baratícimo</Text>
        <Text style={styles.subtitle}>
          Compara precios entre supermercados y farmacias de todo Chile.
        </Text>

        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={onSearch}
            placeholder="Buscar producto"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={onSearch} style={styles.button}>
            <Text style={styles.buttonText}>Buscar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Cadenas incluidas</Text>
        <View style={styles.chainGrid}>
          {CHAINS.map((c) => (
            <View key={c} style={styles.chainCard}>
              <Text style={styles.chainName}>{c}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafafa" },
  container: { padding: 20 },
  title: { fontSize: 32, fontWeight: "700", color: "#0a0a0a" },
  subtitle: { fontSize: 16, color: "#525252", marginTop: 8 },
  searchRow: { flexDirection: "row", gap: 8, marginTop: 24 },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d4d4d4",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#0a0a0a",
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  sectionLabel: {
    marginTop: 32,
    fontSize: 12,
    fontWeight: "500",
    color: "#737373",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  chainGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chainCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    padding: 14,
  },
  chainName: { fontSize: 14, fontWeight: "500", color: "#0a0a0a" },
});
