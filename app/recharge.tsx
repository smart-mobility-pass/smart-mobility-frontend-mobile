import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { ArrowLeft, Wallet, CheckCircle2, Info, CreditCard } from 'lucide-react-native';
import { BillingService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const PREDEFINED_AMOUNTS = [1000, 2000, 5000, 10000, 25000, 50000];

export default function RechargeScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleRecharge = async () => {
        const val = parseInt(amount);
        if (isNaN(val) || val <= 0) {
            Alert.alert("Erreur", "Veuillez entrer un montant valide.");
            return;
        }

        setLoading(true);
        try {
            await BillingService.topUp(user!.id, val, "Rechargement via Application Mobile");
            setSuccess(true);
            setTimeout(() => {
                router.back();
            }, 2000);
        } catch (error: any) {
            console.error("Recharge failed", error);
            Alert.alert("Échec", error.message || "Impossible de traiter le rechargement.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <SafeAreaView style={styles.successContainer}>
                <View style={styles.successContent}>
                    <CheckCircle2 size={100} color="#22C55E" />
                    <Text style={styles.successTitle}>Rechargement Réussi !</Text>
                    <Text style={styles.successDesc}>Votre solde a été mis à jour.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Recharger</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <LinearGradient colors={[Colors.primary, '#4F46E5']} style={styles.balanceCard}>
                        <View style={styles.balanceIconBox}>
                            <Wallet size={24} color={Colors.white} />
                        </View>
                        <Text style={styles.balanceLabel}>Créditer votre compte</Text>
                        <Text style={styles.balanceInstruction}>Sélectionner ou entrer un montant</Text>
                    </LinearGradient>

                    <View style={styles.amountSection}>
                        <Text style={styles.sectionTitle}>Montant (F)</Text>
                        <TextInput
                            style={styles.amountInput}
                            placeholder="0"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />

                        <View style={styles.grid}>
                            {PREDEFINED_AMOUNTS.map((amt) => (
                                <TouchableOpacity
                                    key={amt}
                                    style={[styles.amtBtn, amount === amt.toString() && styles.amtBtnActive]}
                                    onPress={() => setAmount(amt.toString())}
                                >
                                    <Text style={[styles.amtBtnText, amount === amt.toString() && styles.amtBtnTextActive]}>
                                        {amt.toLocaleString('fr-FR')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.methodSection}>
                        <Text style={styles.sectionTitle}>Mode de Paiement</Text>
                        <TouchableOpacity style={styles.methodCard} activeOpacity={0.7}>
                            <CreditCard size={24} color={Colors.primary} />
                            <Text style={styles.methodText}>Carte Bancaire / Mobile Money</Text>
                            <View style={styles.methodBadge}>
                                <Text style={styles.methodBadgeText}>DÉFAUT</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoBox}>
                        <Info size={16} color={Colors.textSecondary} />
                        <Text style={styles.infoText}>
                            Les fonds seront crédités instantanément sur votre compte Smart Mobility.
                        </Text>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.rechargeBtn, !amount && styles.disabledBtn, loading && styles.loadingBtn]}
                        onPress={handleRecharge}
                        disabled={!amount || loading}
                    >
                        <Text style={styles.rechargeBtnText}>{loading ? 'TRAITEMENT...' : 'RECHARGER MAINTENANT'}</Text>
                    </TouchableOpacity>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
    },
    scrollContent: {
        padding: 24,
    },
    balanceCard: {
        padding: 24,
        borderRadius: 28,
        alignItems: 'center',
        marginBottom: 32,
    },
    balanceIconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    balanceLabel: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    balanceInstruction: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
    },
    amountSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 16,
    },
    amountInput: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 20,
        fontSize: 32,
        fontWeight: '900',
        color: Colors.primary,
        textAlign: 'center',
        marginBottom: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    amtBtn: {
        width: '30.33%',
        margin: 6,
        paddingVertical: 14,
        backgroundColor: Colors.white,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    amtBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    amtBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.text,
    },
    amtBtnTextActive: {
        color: Colors.white,
    },
    methodSection: {
        marginBottom: 24,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 20,
        elevation: 2,
    },
    methodText: {
        flex: 1,
        marginLeft: 12,
        fontWeight: '700',
        color: Colors.text,
    },
    methodBadge: {
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    methodBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.primary,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 12,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    footer: {
        padding: 24,
        backgroundColor: Colors.background,
    },
    rechargeBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 4,
    },
    rechargeBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    disabledBtn: {
        backgroundColor: '#CBD5E1',
    },
    loadingBtn: {
        opacity: 0.7,
    },
    successContainer: {
        flex: 1,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successContent: {
        alignItems: 'center',
        padding: 40,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        marginTop: 24,
        marginBottom: 8,
    },
    successDesc: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
    }
});
