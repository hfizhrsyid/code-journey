import AuthHeader from "@/app/authHeader";
import { useAuth } from "@/lib/AuthContext";
import { styles } from "@/styles/login";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Login() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [usernameError, setUsernameError] = useState("");
    
    const validateUsername = () => {
        if (username.trim().length === 0) {
            setUsernameError("Username tidak boleh kosong!");
            return false;
        }

        setUsernameError("");
        return true;
    };

    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const validatePassword = () => {
        if (password.trim().length === 0) {
            setPasswordError("Password tidak boleh kosong!");
            return false;
        }
        setPasswordError("");
        return true;
    };

    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        setLoginError("");
        if (!validateUsername()) return;
        if (!validatePassword()) return;

        setIsLoading(true);
        try {
            await login(username, password);
            router.replace("/main/dashboard");
        } catch (error: any) {
            const errorMsg = error?.message || error?.error || error?.detail || "Login failed";
            setLoginError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <AuthHeader />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={20}
            >
                
                <ScrollView
                    style={{ flex: 1 }} 
                    contentContainerStyle={{ flexGrow: 1}}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.formContainer}>
                        <Text style={styles.welcome}>Welcome Back!</Text>
                        <Text style={styles.subtitle}>Login to your account</Text>

                        <TextInput
                            placeholder="Username"
                            style={styles.input}
                            placeholderTextColor="#999"
                            value={username}
                            onChangeText={setUsername}
                            onBlur={validateUsername}
                        />

                        {usernameError ? (
                            <Text style={{ color: "red", marginTop: -10, marginBottom: 10 }}>
                                {usernameError}
                            </Text>
                        ) : null}

                        <View style={styles.passwordWrapper}>
                            <TextInput
                                placeholder="Password"
                                secureTextEntry={!showPassword}
                                style={styles.passwordInput}
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={text => {
                                    setPassword(text);
                                    if (passwordError) setPasswordError(""); 
                                }}
                                onBlur={validatePassword}
                            />

                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeIcon}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>

                        {passwordError ? (
                            <Text style={{ color: "red", marginTop: 5, marginBottom: 10 }}>
                                {passwordError}
                            </Text>
                        ) : null}

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Login</Text>
                            )}
                        </TouchableOpacity>

                        {loginError ? (
                            <Text style={{ color: "red", marginTop: 10, marginBottom: 10, textAlign: "center" }}>
                                {loginError}
                            </Text>
                        ) : null}

                        <View style={styles.signup}>
                            <Text style={styles.signupText}>Don’t have an account?    </Text>
                            <Pressable onPress={() => router.push("/signup")}>
                                <Text style={styles.signupPress}>Sign Up</Text>
                            </Pressable>
                        </View>
                    </View>
                    
                    
                </ScrollView>   
            </KeyboardAvoidingView>
            
        </View>
    );
}