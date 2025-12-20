import AuthHeader from "@/app/authHeader";
import { useAuth } from "@/lib/AuthContext";
import { styles } from "@/styles/signup";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Signup() {
    const { signup } = useAuth();
    // username
    const [username, setUsername] = useState("");
    const [usernameError, setUsernameError] = useState("");

    const validateUsername = () => {
        if (username.trim().length === 0) {
            setUsernameError("Username tidak boleh kosong!");
            return false;
        }
        if (username.length < 3) {
            setUsernameError("Username minimal 3 karakter!");
            return false;
        }
        setUsernameError("");
        return true;
    };

    // email
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    
    const validateEmail = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            setEmailError("Format email tidak valid (contoh: user@mail.com)");
            return false;
        }

        setEmailError("");
        return true;
    };

    // password
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const validatePassword = () => {
        if (password.trim().length === 0) {
            setPasswordError("Password tidak boleh kosong!");
            return false;
        }
        if (password.length < 6) {
            setPasswordError("Password minimal 6 karakter!");
            return false;
        }
        setPasswordError("");
        return true;
    };

    // confirm password
    const [confirmPassword, setConfirmPassword] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");

    const validateConfirmPassword = () => {
        if (confirmPassword !== password) {
            setConfirmPasswordError("Password tidak cocok!");
            return false;
        }
        setConfirmPasswordError("");
        return true;
    };

    // show password
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [signupError, setSignupError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = async () => {
        setSignupError("");
        if (!validateUsername()) return;
        if (!validateEmail()) return;
        if (!validatePassword()) return;
        if (!validateConfirmPassword()) return;

        setIsLoading(true);
        try {
            await signup(
                username,
                email,
                password,
                username, // firstName
                ""        // lastName
            );
            // Arahkan user baru ke onboarding pertanyaan awal sebelum dashboard
            router.replace("/homePage");
        } catch (error: any) {
            const errorMsg = error?.message || error?.error || error?.detail || "Signup failed";
            setSignupError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
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
                        <Text style={styles.welcome}>Start Your Journey!</Text>
                        <Text style={styles.subtitle}>Sign up for your account</Text>

                        {/* input username */}
                        <TextInput
                            placeholder="Username"
                            style={styles.inputName}
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

                        {/* input email */}
                        <TextInput
                            placeholder="Email"
                            style={styles.inputEmail}
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            onBlur={validateEmail}
                        />

                        {emailError ? (
                            <Text style={{ color: "red", marginTop: -10, marginBottom: 10 }}>
                                {emailError}
                            </Text>
                        ) : null}

                        {/* input password */}
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
                            <Text style={{ color: "red", marginTop: 5, marginBottom: -8 }}>
                                {passwordError}
                            </Text>
                        ) : null}

                        {/* input confirm password */}
                        <View style={styles.confirmPasswordWrapper}>
                            <TextInput
                                placeholder="Confirm Password"
                                secureTextEntry={!showConfirmPassword}
                                style={styles.passwordInput}
                                placeholderTextColor="#999"
                                value={confirmPassword}
                                onChangeText={text => {
                                    setConfirmPassword(text);
                                    if (confirmPasswordError) setConfirmPasswordError("");
                                }}
                                onBlur={validateConfirmPassword}
                            />

                            <TouchableOpacity
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={styles.eyeIcon}
                            >
                                <Ionicons
                                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>

                        {confirmPasswordError ? (
                            <Text style={{ color: "red", marginTop: 5, marginBottom: 10 }}>
                                {confirmPasswordError}
                            </Text>
                        ) : null}

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleSignup}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Sign Up</Text>
                            )}
                        </TouchableOpacity>

                        {signupError ? (
                            <Text style={{ color: "red", marginTop: 10, marginBottom: 10, textAlign: "center" }}>
                                {signupError}
                            </Text>
                        ) : null}

                        <View style={styles.login}>
                            <Text style={styles.loginText}>Already have have an account?    </Text>
                            <Pressable onPress={() => router.push("/login")}>
                                <Text style={styles.loginPress}>Login</Text>
                            </Pressable>
                        </View>
                    </View>

                </ScrollView>

            </KeyboardAvoidingView>
        </View>
    );
}