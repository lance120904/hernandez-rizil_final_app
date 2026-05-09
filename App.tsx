import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
} from "react-native";

const wordsList = {
  easy: ["apple", "cat", "sun", "book", "water", "chair"],
  hard: ["javascript", "database", "component", "keyboard", "architecture"],
  insane: ["microarchitecture", "electroencephalograph", "counterintelligence"],
};

const generateWords = (mode: keyof typeof wordsList) => {
  const source = wordsList[mode];
  return Array.from(
    { length: 80 },
    () => source[Math.floor(Math.random() * source.length)]
  ).join(" ");
};

export default function App() {
  const [registered, setRegistered] = useState(false);
  const [username, setUsername] = useState("");

  const [mode, setMode] = useState<keyof typeof wordsList>("easy");
  const [time, setTime] = useState(30);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const [words, setWords] = useState(generateWords("easy"));
  const [typed, setTyped] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);

  // 🔥 IMPORTANT: input reset trigger
  const [inputKey, setInputKey] = useState(0);

  // ================= TIMER =================
  useEffect(() => {
    if (!started || finished) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setFinished(true);
          setStarted(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [started, finished]);

  // ================= RESET EVERYTHING (MAIN FIX) =================
  const resetSession = (newMode?: keyof typeof wordsList, newTime?: number) => {
    const finalMode = newMode ?? mode;
    const finalTime = newTime ?? time;

    setStarted(false);
    setFinished(false);
    setTyped("");
    setTimeLeft(finalTime);

    // regenerate words ALWAYS
    setWords(generateWords(finalMode));

    // 🔥 force TextInput remount (fixes "not responding" bug)
    setInputKey((k) => k + 1);
  };

  // ================= START =================
  const startTest = () => {
    setStarted(true);
    setFinished(false);
  };

  // ================= WPM =================
  const wpm = useMemo(() => {
    if (!typed.trim()) return 0;
    return typed.trim().split(/\s+/).length;
  }, [typed]);

  // ================= ACCURACY =================
  const accuracy = useMemo(() => {
    if (!typed.length) return 100;

    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === words[i]) correct++;
    }

    return Math.floor((correct / typed.length) * 100);
  }, [typed, words]);

  // ================= REGISTER =================
  if (!registered) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.center}>
          <Text style={styles.logo}>TYPE-X</Text>

          <View style={styles.card}>
            <Text style={styles.title}>Enter Username</Text>

            <TextInput
              style={styles.input}
              placeholder="username..."
              placeholderTextColor="#666"
              value={username}
              onChangeText={setUsername}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={() => username.trim() && setRegistered(true)}
            >
              <Text style={styles.buttonText}>Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.logo}>TYPE-X</Text>
          <Text style={styles.user}>{username}</Text>
        </View>

        {/* MODE */}
        <Text style={styles.label}>Mode</Text>
        <View style={styles.row}>
          {(["easy", "hard", "insane"] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, mode === m && styles.activeMode]}
              onPress={() => {
                setMode(m);
                resetSession(m, time);
              }}
            >
              <Text style={styles.btnText}>{m.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TIME */}
        <Text style={styles.label}>Time</Text>
        <View style={styles.row}>
          {[20, 30, 40, 50, 60].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.timeBtn, time === t && styles.activeTime]}
              onPress={() => {
                setTime(t);
                resetSession(mode, t);
              }}
            >
              <Text style={styles.btnText}>{t}s</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* START / RETRY */}
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => {
            resetSession();
            startTest();
          }}
        >
          <Text style={styles.startText}>
            {finished ? "RETRY" : "START"}
          </Text>
        </TouchableOpacity>

        {/* TEXT */}
        <View style={styles.karaokeBox}>
          <Text style={styles.text}>
            {words.split("").map((char, i) => {
              let color = "#555";

              if (i === typed.length) color = "#fff";
              else if (i < typed.length)
                color = typed[i] === char ? "#00ff99" : "#ff4d6d";

              return (
                <Text key={i} style={{ color }}>
                  {char}
                </Text>
              );
            })}
          </Text>
        </View>

        {/* INPUT (🔥 FIXED CORE) */}
        {!finished && (
          <TextInput
            key={inputKey}
            style={styles.realInput}
            autoFocus
            value={typed}
            onChangeText={(text) => {
              if (!started && text.length > 0) setStarted(true);
              setTyped(text);
            }}
          />
        )}

        {/* RESULT */}
        {finished && (
          <View style={styles.result}>
            <Text style={styles.resultTitle}>DONE</Text>
            <Text style={styles.resultText}>WPM: {wpm}</Text>
            <Text style={styles.resultText}>Accuracy: {accuracy}%</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                resetSession();
                startTest();
              }}
            >
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ================= STYLES =================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1020" },
  center: { flex: 1, justifyContent: "center", padding: 20 },
  logo: { color: "#00ffcc", fontSize: 34, fontWeight: "900" },
  card: { marginTop: 20, backgroundColor: "#141b34", padding: 20, borderRadius: 20 },
  title: { color: "#fff", fontSize: 22, marginBottom: 10 },
  input: { backgroundColor: "#1c2440", padding: 15, borderRadius: 15, color: "#fff", marginBottom: 15 },
  button: { backgroundColor: "#00ffcc", padding: 15, borderRadius: 15, alignItems: "center" },
  buttonText: { fontWeight: "900", color: "#0b1020" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  user: { color: "#00ffcc", fontWeight: "700" },
  label: { color: "#fff", marginVertical: 10 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  modeBtn: { width: "30%", backgroundColor: "#141b34", padding: 12, borderRadius: 12, alignItems: "center" },
  timeBtn: { width: "18%", backgroundColor: "#141b34", padding: 10, borderRadius: 12, alignItems: "center" },
  activeMode: { backgroundColor: "#00ffcc" },
  activeTime: { backgroundColor: "#7c3aed" },
  btnText: { color: "#fff", fontWeight: "700" },
  startBtn: { backgroundColor: "#00ffcc", padding: 15, borderRadius: 15, marginVertical: 20, alignItems: "center" },
  startText: { fontWeight: "900", color: "#0b1020" },
  karaokeBox: { backgroundColor: "#141b34", padding: 20, borderRadius: 20, minHeight: 140 },
  text: { fontSize: 26, lineHeight: 42 },
  realInput: {
    backgroundColor: "#1c2440",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  result: { marginTop: 20, backgroundColor: "#141b34", padding: 20, borderRadius: 20, alignItems: "center" },
  resultTitle: { color: "#00ffcc", fontSize: 24, fontWeight: "900" },
  resultText: { color: "#fff", marginTop: 5 },
});