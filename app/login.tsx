import AuthHeader from "@/app/authHeader";
import { styles } from "@/styles/login";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Login() {
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
                            placeholder="Email"
                            style={styles.input}
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
                            onPress={() => {
                                if (!validateEmail()) return;
                                if (!validatePassword()) return;

                                router.push("/main/dashboard");
                            }}
                        >

                            <Text style={styles.buttonText}>Login</Text>
                        </TouchableOpacity>

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