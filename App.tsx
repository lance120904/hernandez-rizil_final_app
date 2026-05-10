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

import { supabase } from "./src/screens/connection/supabase-client";

const wordsList = {
  easy: ["apple", "cat", "sun", "book", "water", "chair"],
  hard: ["javascript", "database", "component", "keyboard", "architecture"],
  insane: [
    "microarchitecture",
    "electroencephalograph",
    "counterintelligence",
  ],
};

// ================= WORD GENERATOR =================
const generateWords = (mode: keyof typeof wordsList) => {
  const source = wordsList[mode];

  return Array.from(
    { length: 80 },
    () => source[Math.floor(Math.random() * source.length)]
  );
};

export default function App() {
  const [registered, setRegistered] = useState(false);
  const [username, setUsername] = useState("");

  const [mode, setMode] = useState<keyof typeof wordsList>("easy");
  const [time, setTime] = useState(30);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const [words, setWords] = useState<string[]>(generateWords("easy"));
  const [typed, setTyped] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);

  const [inputKey, setInputKey] = useState(0);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // ================= WINDOW =================
  const [windowStart, setWindowStart] = useState(0);
  const WINDOW_SIZE = 12;

  const typedWords = typed.trim().split(/\s+/).filter(Boolean);

  // ================= SAVE USER =================
  const saveUser = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            username: username.trim(),
          },
          {
            onConflict: "username",
          }
        );

      if (error) {
        console.log(error);
        return;
      }

      setRegistered(true);
    } catch (err) {
      console.log(err);
    }
  };

  // ================= SAVE SCORE =================
  const saveScore = async (
    finalWpm: number,
    finalAccuracy: number
  ) => {
    try {
      const { data, error } = await supabase
        .from("typing_scores")
        .insert([
          {
            username: username.trim(),
            wpm: Number(finalWpm),
            accuracy: Number(finalAccuracy),
            mode: String(mode),
            time_limit: Number(time),
          },
        ])
        .select();

      if (error) {
        console.log("SUPABASE ERROR:", error);
      } else {
        console.log("SUCCESS:", data);
      }
    } catch (err) {
      console.log("CATCH ERROR:", err);
    }
  };

  // ================= FETCH LEADERBOARD =================
  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from("typing_scores")
      .select("*")
      .order("wpm", { ascending: false })
      .limit(10);

    if (error) {
      console.log("LEADERBOARD ERROR:", error);
    }

    if (data) {
      setLeaderboard(data);
    }
  };

  // ================= TIMER (FIXED) =================
  useEffect(() => {
    if (!started || finished) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);

          const finalWpm = typed.trim()
            ? typed.trim().split(/\s+/).length
            : 0;

          let correct = 0;
          const fullText = words.join(" ");

          for (let i = 0; i < typed.length; i++) {
            if (typed[i] === fullText[i]) {
              correct++;
            }
          }

          const finalAccuracy = typed.length
            ? Math.floor((correct / typed.length) * 100)
            : 100;

          saveScore(finalWpm, finalAccuracy);

          setFinished(true);
          setStarted(false);

          fetchLeaderboard();

          return 0;
        }

        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);

    // FIX: removed typed from dependency
  }, [started, finished]);

  // ================= FETCH AFTER FINISH =================
  useEffect(() => {
    if (finished) {
      fetchLeaderboard();
    }
  }, [finished]);

  // ================= AUTO SCROLL =================
  useEffect(() => {
    const currentIndex = typedWords.length;

    if (currentIndex >= windowStart + WINDOW_SIZE - 2) {
      setWindowStart((prev) => prev + 1);
    }
  }, [typedWords.length]);

  // ================= RESET =================
  const resetSession = (
    newMode?: keyof typeof wordsList,
    newTime?: number
  ) => {
    const finalMode = newMode ?? mode;
    const finalTime = newTime ?? time;

    setStarted(false);
    setFinished(false);

    setTyped("");
    setTimeLeft(finalTime);

    setWords(generateWords(finalMode));

    setWindowStart(0);

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

    const fullText = words.join(" ");

    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === fullText[i]) {
        correct++;
      }
    }

    return Math.floor((correct / typed.length) * 100);
  }, [typed, words]);

  // ================= VISIBLE WORDS =================
  const visibleWords = words.slice(
    windowStart,
    windowStart + WINDOW_SIZE
  );

  // ================= REGISTER SCREEN =================
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
              value={username}
              onChangeText={setUsername}
              placeholder="username..."
              placeholderTextColor="#666"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={async () => {
                if (!username.trim()) return;

                await saveUser();

                setRegistered(true);
              }}
            >
              <Text style={styles.buttonText}>Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ================= MAIN APP =================
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
              style={[
                styles.modeBtn,
                mode === m && styles.activeMode,
              ]}
              onPress={() => {
                setMode(m);

                resetSession(m, time);
              }}
            >
              <Text style={styles.btnText}>
                {m.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TIME */}
        <Text style={styles.label}>Time</Text>

        <View style={styles.row}>
          {[20, 30, 40, 50, 60].map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.timeBtn,
                time === t && styles.activeTime,
              ]}
              onPress={() => {
                setTime(t);

                resetSession(mode, t);
              }}
            >
              <Text style={styles.btnText}>{t}s</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* START BUTTON */}
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

        {/* TIMER */}
        {started && !finished && (
          <Text
            style={[
              styles.timer,
              timeLeft <= 10 && { color: "#ff4d6d" },
            ]}
          >
            {timeLeft}s
          </Text>
        )}

        {/* WORDS */}
        <View style={styles.karaokeBox}>
          <Text style={styles.text}>
            {visibleWords.map((word, i) => {
              const globalIndex = windowStart + i;

              const typedWord = typedWords[globalIndex];

              let color = "#777";

              if (typedWord !== undefined) {
                color =
                  typedWord === word
                    ? "#00ff99"
                    : "#ff4d6d";
              }

              if (globalIndex === typedWords.length) {
                color = "#fff";
              }

              return (
                <Text key={i} style={{ color }}>
                  {word + " "}
                </Text>
              );
            })}
          </Text>
        </View>

        {/* INPUT */}
        {!finished && (
          <TextInput
            key={inputKey}
            style={styles.realInput}
            value={typed}
            onChangeText={(text) => {
              if (!started && text.length > 0) {
                setStarted(true);
              }

              setTyped(text);
            }}
            autoFocus
          />
        )}

        {/* RESULT */}
        {finished && (
          <View style={styles.result}>
            <Text style={styles.resultTitle}>DONE</Text>

            <Text style={styles.resultText}>
              WPM: {wpm}
            </Text>

            <Text style={styles.resultText}>
              Accuracy: {accuracy}%
            </Text>
          </View>
        )}

        {/* LEADERBOARD */}
        {finished && (
          <View style={styles.result}>
            <Text style={styles.resultTitle}>
              🏆 LEADERBOARD
            </Text>

            {leaderboard.map((item, index) => (
              <Text
                key={item.id}
                style={styles.resultText}
              >
                {index + 1}. {item.username} — {item.wpm} WPM —
                {" "}
                {item.accuracy}%
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ================= STYLES =================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1020",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },

  logo: {
    color: "#00ffcc",
    fontSize: 34,
    fontWeight: "900",
  },

  card: {
    marginTop: 20,
    backgroundColor: "#141b34",
    padding: 20,
    borderRadius: 20,
  },

  title: {
    color: "#fff",
    fontSize: 22,
    marginBottom: 10,
  },

  input: {
    backgroundColor: "#1c2440",
    padding: 15,
    borderRadius: 15,
    color: "#fff",
    marginBottom: 15,
  },

  button: {
    backgroundColor: "#00ffcc",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
  },

  buttonText: {
    fontWeight: "900",
    color: "#0b1020",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  user: {
    color: "#00ffcc",
    fontWeight: "700",
  },

  label: {
    color: "#fff",
    marginVertical: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  modeBtn: {
    width: "30%",
    backgroundColor: "#141b34",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  timeBtn: {
    width: "18%",
    backgroundColor: "#141b34",
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
  },

  activeMode: {
    backgroundColor: "#00ffcc",
  },

  activeTime: {
    backgroundColor: "#7c3aed",
  },

  btnText: {
    color: "#fff",
    fontWeight: "700",
  },

  startBtn: {
    backgroundColor: "#00ffcc",
    padding: 15,
    borderRadius: 15,
    marginVertical: 20,
    alignItems: "center",
  },

  startText: {
    fontWeight: "900",
    color: "#0b1020",
  },

  timer: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "900",
    color: "#00ffcc",
    marginBottom: 10,
  },

  karaokeBox: {
    backgroundColor: "#141b34",
    padding: 20,
    borderRadius: 20,
    minHeight: 120,
  },

  text: {
    fontSize: 26,
    lineHeight: 42,
  },

  realInput: {
    backgroundColor: "#1c2440",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
  },

  result: {
    marginTop: 20,
    backgroundColor: "#141b34",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
  },

  resultTitle: {
    color: "#00ffcc",
    fontSize: 24,
    fontWeight: "900",
  },

  resultText: {
    color: "#fff",
    marginTop: 5,
  },
});