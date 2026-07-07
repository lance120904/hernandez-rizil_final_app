import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";

import { supabase } from "./src/screens/connection/supabase-client";
import { Video } from "expo-av";
const { width } = Dimensions.get("window");

// ================= WORDS =================
const wordsList = {
  easy: ["apple", "cat", "sun", "book", "water", "chair"],
  hard: ["javascript", "database", "component", "keyboard", "architecture"],
  insane: [
    "microarchitecture",
    "electroencephalograph",
    "counterintelligence",
  ],
};

const generateWords = (mode: keyof typeof wordsList) => {
  const source = wordsList[mode];

  return Array.from(
    { length: 80 },
    () => source[Math.floor(Math.random() * source.length)]
  );
};

export default function App() {
  // ================= AUTH =================
  const [screen, setScreen] = useState<
    "welcome" | "login" | "register" | "app"
  >("welcome");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [authError, setAuthError] = useState("");

  // ================= APP =================
  const [mode, setMode] =
    useState<keyof typeof wordsList>("easy");

  const [time, setTime] = useState(30);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const [words, setWords] =
    useState<string[]>(generateWords("easy"));

  const [typed, setTyped] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);

  const [inputKey, setInputKey] = useState(0);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [showTypers, setShowTypers] = useState(false);

  const [allTypers, setAllTypers] = useState<any[]>([]);

  const [showVideo, setShowVideo] = useState(false);
const [resultVideo, setResultVideo] = useState<any>(null);

const [finalWpm, setFinalWpm] = useState(0);
const [finalAccuracy, setFinalAccuracy] = useState(100);

  // ================= WINDOW =================
  const [windowStart, setWindowStart] = useState(0);

  const WINDOW_SIZE = 12;

  const typedWords = typed.trim().split(/\s+/).filter(Boolean);
  
  useEffect(() => {
  typedRef.current = typed;
}, [typed]);
  // ================= ANIMATION =================
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const typedRef = useRef("");

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const move1 = floatAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const move2 = floatAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40],
  });

  // ================= REGISTER =================
  const registerUser = async () => {
    try {
      setAuthError("");

      const cleanUsername = username.trim().toLowerCase();

      if (!cleanUsername || !password.trim()) {
        setAuthError("Complete all fields.");
        return;
      }

      const { data: existingUser } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", cleanUsername)
        .maybeSingle();

      if (existingUser) {
        setAuthError("Username already exists.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .insert([
          {
            username: cleanUsername,
            password: password,
          },
        ]);

      if (error) {
        console.log(error);
        setAuthError("Registration failed.");
        return;
      }

      setScreen("app");
    } catch (err) {
      console.log(err);
    }
  };

  // ================= LOGIN =================
  const loginUser = async () => {
    try {
      setAuthError("");

      const cleanUsername = username.trim().toLowerCase();

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", cleanUsername)
        .eq("password", password)
        .maybeSingle();

      if (error) {
        console.log(error);
        setAuthError("Login error.");
        return;
      }

      if (!data) {
        setAuthError("Invalid username or password.");
        return;
      }

      setScreen("app");
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
      const cleanUsername = username.trim().toLowerCase();

      const { data: oldScore } = await supabase
        .from("typing_scores")
        .select("*")
        .eq("username", cleanUsername)
        .maybeSingle();

      if (!oldScore) {
        await supabase.from("typing_scores").insert([
          {
            username: cleanUsername,
            wpm: finalWpm,
            accuracy: finalAccuracy,
            mode,
            time_limit: time,
          },
        ]);

        return;
      }

      if (finalWpm > oldScore.wpm) {
        await supabase
          .from("typing_scores")
          .update({
            wpm: finalWpm,
            accuracy: finalAccuracy,
            mode,
            time_limit: time,
          })
          .eq("username", cleanUsername);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ================= LEADERBOARD =================
  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from("typing_scores")
      .select("*")
      .order("wpm", { ascending: false })
      .limit(5);

    if (data) {
      setLeaderboard(data);
    }
  };

  // ================= USERS =================
  const fetchTypers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("username", { ascending: true });

    if (data) {
      setAllTypers(data);
    }
  };

  // ================= TIMER =================
 useEffect(() => {
  if (!started || finished) return;

  const interval = setInterval(() => {
    setTimeLeft((t) => {
      if (t <= 1) {
        clearInterval(interval);

        const latestTyped = typedRef.current;

        const calculatedWpm = latestTyped.trim()
          ? latestTyped.trim().split(/\s+/).length
          : 0;

        let correct = 0;

        const fullText = words.join(" ");

        for (let i = 0; i < latestTyped.length; i++) {
          if (latestTyped[i] === fullText[i]) {
            correct++;
          }
        }

        const calculatedAccuracy = latestTyped.length
          ? Math.floor(
              (correct / latestTyped.length) * 100
            )
          : 100;

        console.log(
          "Saving WPM:",
          calculatedWpm
        );

        setFinalWpm(calculatedWpm);
        setFinalAccuracy(calculatedAccuracy);

        saveScore(
          calculatedWpm,
          calculatedAccuracy
        );

        setResultVideo(
          getResultVideo(
            calculatedWpm,
            calculatedAccuracy
          )
        );

        setShowVideo(true);

        setFinished(true);
        setStarted(false);

        fetchLeaderboard();

        return 0;
      }

      return t - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [started, finished, words]);

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

  setFinalWpm(0);

  setFinalAccuracy(100);
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

  // ================= WORDS =================
  const visibleWords = words.slice(
    windowStart,
    windowStart + WINDOW_SIZE
  );

  // ================= WELCOME =================
  if (screen === "welcome") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.background}>
          <Animated.View
            style={[
              styles.blob1,
              {
                transform: [{ translateY: move1 }],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.blob2,
              {
                transform: [{ translateY: move2 }],
              },
            ]}
          />
        </View>

        <View style={styles.center}>
          <Text style={styles.logo}>TYPE-X</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setScreen("login")}
          >
            <Text style={styles.buttonText}>
              START
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ================= LOGIN =================
  if (screen === "login") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.background}>
          <Animated.View
            style={[
              styles.blob1,
              {
                transform: [{ translateY: move1 }],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.blob2,
              {
                transform: [{ translateY: move2 }],
              },
            ]}
          />
        </View>

        <View style={styles.center}>
          <Text style={styles.logo}>LOGIN</Text>

          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {authError ? (
              <Text style={styles.errorText}>
                {authError}
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.button}
              onPress={loginUser}
            >
              <Text style={styles.buttonText}>
                LOGIN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setAuthError("");
                setScreen("register");
              }}
            >
              <Text style={styles.link}>
                No account? Register
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ================= REGISTER =================
  if (screen === "register") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.background}>
          <Animated.View
            style={[
              styles.blob1,
              {
                transform: [{ translateY: move1 }],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.blob2,
              {
                transform: [{ translateY: move2 }],
              },
            ]}
          />
        </View>

        <View style={styles.center}>
          <Text style={styles.logo}>REGISTER</Text>

          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {authError ? (
              <Text style={styles.errorText}>
                {authError}
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.button}
              onPress={registerUser}
            >
              <Text style={styles.buttonText}>
                REGISTER
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setAuthError("");
                setScreen("login");
              }}
            >
              <Text style={styles.link}>
                Already have account? Login
              </Text>
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

{showVideo && (
  <View style={styles.videoOverlay}>
    <TouchableOpacity
      style={styles.closeBtn}
      onPress={() => setShowVideo(false)}
    >
      <Text style={{ color: "#fff" }}>✕</Text>
    </TouchableOpacity>

    <View style={styles.videoWrapper}>
      <Video
  source={resultVideo}
  style={{
    width: 320,
    height: 180,
  }}
  resizeMode="contain"
  shouldPlay
  isLooping
  useNativeControls
/>
    </View>
  </View>
)}
    )}

      <View style={styles.background}>
        <Animated.View
          style={[
            styles.blob1,
            {
              transform: [{ translateY: move1 }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.blob2,
            {
              transform: [{ translateY: move2 }],
            },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.header}>
          <Text style={styles.logoSmall}>
            TYPE-X
          </Text>

          <Text style={styles.user}>
            {username}
          </Text>
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
              <Text style={styles.btnText}>
                {t}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* START */}
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => {
            resetSession();
            setStarted(true);
          }}
        >
          <Text style={styles.startText}>
            {finished ? "RETRY" : "START"}
          </Text>
        </TouchableOpacity>

        {/* TIMER */}
        {started && !finished && (
          <Text style={styles.timer}>
            {timeLeft}s
          </Text>
        )}

        {/* WORDS */}
        <View style={styles.karaokeBox}>
          <Text style={styles.text}>
            {visibleWords.map((word, i) => {
              const globalIndex = windowStart + i;

              const typedWord =
                typedWords[globalIndex];

              let color = "#777";

              if (typedWord !== undefined) {
                color =
                  typedWord === word
                    ? "#00ff99"
                    : "#ff4d6d";
              }

              if (
                globalIndex === typedWords.length
              ) {
                color = "#fff";
              }

              return (
                <Text
                  key={i}
                  style={{ color }}
                >
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
              if (
                !started &&
                text.length > 0
              ) {
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
            <Text style={styles.resultTitle}>
              DONE
            </Text>

            <Text style={styles.resultText}>
              WPM: {finalWpm}
            </Text>

            <Text style={styles.resultText}>
              Accuracy: {finalAccuracy}%
            </Text>
          </View>
        )}

        {/* LEADERBOARD */}
        {finished && (
          <View style={styles.result}>
            <Text style={styles.resultTitle}>
              🏆 TOP 5
            </Text>

            {leaderboard.map((item, index) => (
              <Text
                key={item.id}
                style={styles.resultText}
              >
                #{index + 1} {item.username}
              </Text>
            ))}
          </View>
        )}

        {/* TYPERS */}
        <TouchableOpacity
          style={styles.typersBtn}
          onPress={async () => {
            await fetchTypers();
            setShowTypers(!showTypers);
          }}
        >
          <Text style={styles.buttonText}>
            TYPERS
          </Text>
        </TouchableOpacity>

        {showTypers && (
          <View style={styles.result}>
            <Text style={styles.resultTitle}>
              👥 ALL TYPERS
            </Text>

            {allTypers.map((item) => (
              <Text
                key={item.id}
                style={styles.resultText}
              >
                {item.username}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ================= Videos =================

const getResultVideo = (wpm: number, accuracy: number) => {
  if (wpm >= 20 && accuracy >= 90) {
    return require("./assets/videos/0511.mp4");
  }
 if (wpm >= 15 && accuracy >= 90) {
    return require("./assets/videos/meme.mp4");
  }

  if (wpm >= 10 && accuracy >= 50){
    return require("./assets/videos/0511(1).mp4");
  }
  return require("./assets/videos/0511(2).mp4");
};
// ================= STYLES =================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
  },

  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  blob1: {
    position: "absolute",
    width: 260,
    height: 260,
    backgroundColor: "rgba(0,255,204,0.18)",
    borderRadius: 200,
    top: -50,
    left: -60,
  },

  blob2: {
    position: "absolute",
    width: 300,
    height: 300,
    backgroundColor: "rgba(124,58,237,0.20)",
    borderRadius: 300,
    bottom: -80,
    right: -80,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    zIndex: 10,
  },

  logo: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 4,
  },

  logoSmall: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 22,
    borderRadius: 28,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 16,
    borderRadius: 18,
    color: "#fff",
    marginBottom: 14,
    fontSize: 16,
  },

  errorText: {
    color: "#ff6b81",
    marginBottom: 10,
    fontWeight: "600",
  },

  button: {
    backgroundColor: "rgba(0,255,204,0.15)",
    borderWidth: 1,
    borderColor: "rgba(0,255,204,0.3)",
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
  },

  buttonText: {
    color: "#ffffff",
    fontWeight: "900",
    letterSpacing: 1,
    fontSize: 15,
  },

  link: {
    color: "#00ffcc",
    textAlign: "center",
    marginTop: 18,
    fontWeight: "600",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },

  user: {
    color: "#00ffcc",
    fontWeight: "700",
    fontSize: 16,
  },

  label: {
    color: "#fff",
    marginVertical: 12,
    fontWeight: "700",
    fontSize: 16,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  modeBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  timeBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  activeMode: {
    backgroundColor: "rgba(0,255,204,0.25)",
    borderColor: "#00ffcc",
  },

  activeTime: {
    backgroundColor: "rgba(124,58,237,0.3)",
    borderColor: "#7c3aed",
  },

  btnText: {
    color: "#fff",
    fontWeight: "700",
  },

  startBtn: {
    backgroundColor: "rgba(0,255,204,0.18)",
    padding: 18,
    borderRadius: 20,
    marginVertical: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,255,204,0.4)",
  },

  typersBtn: {
    backgroundColor: "rgba(124,58,237,0.25)",
    padding: 16,
    borderRadius: 20,
    marginTop: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.35)",
  },

  startText: {
    fontWeight: "900",
    color: "#ffffff",
    fontSize: 16,
    letterSpacing: 1,
  },

  timer: {
    textAlign: "center",
    fontSize: 34,
    fontWeight: "900",
    color: "#00ffcc",
    marginBottom: 14,
  },

  karaokeBox: {
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 24,
    borderRadius: 28,
    minHeight: 140,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  text: {
    fontSize: 28,
    lineHeight: 44,
    fontWeight: "600",
  },

  realInput: {
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "#fff",
    padding: 16,
    borderRadius: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    fontSize: 16,
  },

  result: {
    marginTop: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 24,
    borderRadius: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  resultTitle: {
    color: "#00ffcc",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 8,
  },

  resultText: {
    color: "#fff",
    marginTop: 6,
    fontSize: 16,
    fontWeight: "600",
  },
videoOverlay: {
  position: "absolute",
  bottom: 20,
  alignSelf: "center",

  width: 320,
  height: 180, // 16:9 ratio

  backgroundColor: "#000",
  borderRadius: 20,
  overflow: "hidden",
  zIndex: 999,
},

videoWrapper: {
  width: "100%",
  height: "100%",
},

video: {
  width: "100%",
  height: "100%",
},

video: {
  flex: 1,
},

closeBtn: {
  position: "absolute",
  top: 10,
  right: 10,
  zIndex: 1000,
  backgroundColor: "rgba(0,0,0,0.5)",
  padding: 6,
  borderRadius: 20,
},
});