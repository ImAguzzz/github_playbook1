import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Post = {
  id: number;
  author: string;
  content: string;
  createdAt: string;
};

const API_URL = `${process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api"}`.replace(/\/$/, "");
const PROFILE_KEY = "ruang.profileName";

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body.error === "string") {
      return body.error;
    }
  } catch {
    return `Server returned status ${response.status}.`;
  }
  return `Server returned status ${response.status}.`;
}

export default function App() {
  const [profileName, setProfileName] = useState("");
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    const response = await fetch(`${API_URL}/posts`);
    if (!response.ok) {
      throw new Error(await readError(response));
    }
    setPosts(await response.json() as Post[]);
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const savedName = await AsyncStorage.getItem(PROFILE_KEY);
        if (active && savedName) {
          setProfileName(savedName);
        }
        await loadPosts();
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load Ruang.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void initialize();
    return () => {
      active = false;
    };
  }, [loadPosts]);

  const saveProfileName = async () => {
    const name = profileName.trim();
    if (!name) {
      setError("Enter your profile name.");
      return;
    }
    try {
      await AsyncStorage.setItem(PROFILE_KEY, name);
      setProfileName(name);
      setError("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your profile name.");
    }
  };

  const refreshPosts = async () => {
    setRefreshing(true);
    try {
      await loadPosts();
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not refresh posts.");
    } finally {
      setRefreshing(false);
    }
  };

  const createPost = async () => {
    const author = profileName.trim();
    const message = content.trim();
    if (!author) {
      setError("Add your profile name before posting.");
      return;
    }
    if (!message || message.length > 500) {
      setError("Write a post between 1 and 500 characters.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await AsyncStorage.setItem(PROFILE_KEY, author);
      const response = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ author, content: message }),
      });
      if (!response.ok) {
        throw new Error(await readError(response));
      }
      const post = await response.json() as Post;
      setPosts((current) => [post, ...current]);
      setContent("");
      Keyboard.dismiss();
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : "Could not publish your post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <FlatList
        data={posts}
        keyExtractor={(post) => String(post.id)}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshPosts} tintColor="#245b45" />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.brandMark}><Text style={styles.brandMarkText}>R</Text></View>
              <View>
                <Text style={styles.brand}>ruang.</Text>
                <Text style={styles.brandCaption}>COMMUNITY HUB</Text>
              </View>
            </View>

            <Text style={styles.eyebrow}>RUANG KOMUNITAS</Text>
            <Text style={styles.title}>Halo, {profileName.trim() || "teman"} 👋</Text>
            <Text style={styles.subtitle}>Bagikan ide dan ceritamu dengan komunitas.</Text>

            <View style={styles.composer}>
              <Text style={styles.sectionTitle}>Buat post</Text>
              <Text style={styles.label}>Nama profil</Text>
              <TextInput
                value={profileName}
                onChangeText={setProfileName}
                onBlur={() => { void saveProfileName(); }}
                placeholder="Nama yang akan tampil"
                placeholderTextColor="#98a39b"
                maxLength={60}
                autoCapitalize="words"
                style={styles.input}
                accessibilityLabel="Nama profil"
              />
              <Text style={styles.label}>Ceritakan sesuatu</Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Apa yang ingin kamu bagikan?"
                placeholderTextColor="#98a39b"
                maxLength={500}
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.messageInput]}
                accessibilityLabel="Isi post"
              />
              <Text style={styles.counter}>{content.length}/500</Text>
              <Pressable
                onPress={() => { void createPost(); }}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (pressed || submitting) && styles.buttonPressed,
                ]}
                accessibilityRole="button"
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryButtonText}>Publikasikan post</Text>}
              </Pressable>
            </View>

            <View style={styles.feedHeading}>
              <Text style={styles.sectionTitle}>Post komunitas</Text>
              <Text style={styles.feedHint}>Tarik ke bawah untuk memuat ulang</Text>
            </View>
            {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
            {loading ? <ActivityIndicator style={styles.loader} color="#245b45" /> : null}
          </View>
        }
        ListEmptyComponent={
          loading ? undefined : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Belum ada post</Text>
              <Text style={styles.emptyText}>Jadilah orang pertama yang berbagi cerita.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <View style={styles.postAvatar}>
              <Text style={styles.postAvatarText}>{item.author.trim().slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.postBody}>
              <View style={styles.postMeta}>
                <Text style={styles.postAuthor}>{item.author}</Text>
                <Text style={styles.postDate}>
                  {new Date(`${item.createdAt.replace(" ", "T")}Z`).toLocaleDateString("id-ID")}
                </Text>
              </View>
              <Text style={styles.postContent}>{item.content}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f6f7f4" },
  listContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 32 },
  brandMark: {
    width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: "#245b45",
  },
  brandMarkText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  brand: { color: "#17241f", fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  brandCaption: { marginTop: 2, color: "#78827b", fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  eyebrow: { marginBottom: 8, color: "#245b45", fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  title: { color: "#17241f", fontSize: 25, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { marginTop: 7, marginBottom: 22, color: "#78827b", fontSize: 14, lineHeight: 21 },
  composer: {
    padding: 18, borderWidth: 1, borderColor: "#e9ece7", borderRadius: 15,
    backgroundColor: "#fff",
  },
  sectionTitle: { color: "#17241f", fontSize: 16, fontWeight: "800" },
  label: { marginTop: 16, marginBottom: 7, color: "#526057", fontSize: 12, fontWeight: "700" },
  input: {
    minHeight: 46, paddingHorizontal: 13, paddingVertical: 11, borderWidth: 1,
    borderColor: "#e3e9e3", borderRadius: 10, color: "#17241f", fontSize: 14,
    backgroundColor: "#fbfcfa",
  },
  messageInput: { minHeight: 108 },
  counter: { marginTop: 6, color: "#78827b", fontSize: 11, textAlign: "right" },
  primaryButton: {
    minHeight: 46, marginTop: 14, alignItems: "center", justifyContent: "center",
    borderRadius: 10, backgroundColor: "#245b45",
  },
  buttonPressed: { opacity: 0.75 },
  primaryButtonText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  feedHeading: { marginTop: 28, marginBottom: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  feedHint: { maxWidth: 145, color: "#78827b", fontSize: 10, textAlign: "right" },
  error: {
    marginBottom: 12, padding: 12, borderRadius: 9, color: "#9b3b32",
    backgroundColor: "#fcebea", fontSize: 12, lineHeight: 18,
  },
  loader: { marginVertical: 20 },
  emptyState: {
    alignItems: "center", padding: 24, borderWidth: 1, borderColor: "#e9ece7",
    borderRadius: 13, backgroundColor: "#fff",
  },
  emptyTitle: { color: "#2a362e", fontSize: 14, fontWeight: "700" },
  emptyText: { marginTop: 6, color: "#78827b", fontSize: 12, textAlign: "center" },
  postCard: {
    flexDirection: "row", gap: 11, marginBottom: 11, padding: 15, borderWidth: 1,
    borderColor: "#e9ece7", borderRadius: 13, backgroundColor: "#fff",
  },
  postAvatar: {
    width: 34, height: 34, alignItems: "center", justifyContent: "center",
    borderRadius: 17, backgroundColor: "#e8f1eb",
  },
  postAvatarText: { color: "#245b45", fontWeight: "800" },
  postBody: { flex: 1 },
  postMeta: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  postAuthor: { flex: 1, color: "#2a362e", fontSize: 12, fontWeight: "800" },
  postDate: { color: "#78827b", fontSize: 10 },
  postContent: { marginTop: 8, color: "#526057", fontSize: 13, lineHeight: 20 },
});
