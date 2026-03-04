import { useRouter } from 'expo-router';
import { Lock, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../components/Button';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const router = useRouter();
    const { login, isAuthenticated, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    React.useEffect(() => {
        if (isAuthenticated) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated]);

    const handleLogin = async () => {
        try {
            await login();
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <View style={styles.logoInner} />
                    </View>
                    <Text style={styles.title}>Mobilité Urbaine</Text>
                    <Text style={styles.subtitle}>Commencez votre voyage</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputCard}>
                        <View style={styles.inputRow}>
                            <User size={20} color={Colors.primary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Nom d'utilisateur"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.inputRow}>
                            <Lock size={20} color={Colors.primary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Mot de passe"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.forgotPass}>
                        <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
                    </TouchableOpacity>

                    <Button
                        title="Se connecter"
                        onPress={handleLogin}
                        style={styles.loginBtn}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Pas de compte ? </Text>
                        <TouchableOpacity>
                            <Text style={styles.signUpText}>S'inscrire</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
        padding: 30,
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    logoInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
    form: {
        width: '100%',
    },
    inputCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        marginBottom: 20,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: Colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 8,
    },
    forgotPass: {
        alignSelf: 'flex-end',
        marginBottom: 40,
    },
    forgotText: {
        color: Colors.primary,
        fontWeight: '600',
    },
    loginBtn: {
        height: 60,
        borderRadius: 30,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    footerText: {
        color: Colors.textSecondary,
    },
    signUpText: {
        color: Colors.primary,
        fontWeight: '700',
    }
});
