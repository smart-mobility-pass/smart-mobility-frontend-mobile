import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react-native';
import { BillingService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RechargeHistoryScreen() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!user) return;
            try {
                const data = await BillingService.getTransactions(user.id);
                setTransactions(data || []);
            } catch (error) {
                console.error("Failed to fetch transactions", error);
            } finally {
                setLoading(false);
            }
        };
        if (!authLoading) fetchTransactions();
    }, [user, authLoading]);

    const renderItem = ({ item }: { item: any }) => {
        const isCredit = item.type === 'CREDIT';
        return (
            <View style={styles.txCard}>
                <View style={[styles.iconBox, isCredit ? styles.creditIcon : styles.debitIcon]}>
                    {isCredit ? <ArrowDownLeft size={20} color="#22C55E" /> : <ArrowUpRight size={20} color="#EF4444" />}
                </View>
                <View style={styles.txContent}>
                    <Text style={styles.txTitle}>{item.description || (isCredit ? 'Rechargement' : 'Paiement Trajet')}</Text>
                    <View style={styles.txDateRow}>
                        <Calendar size={12} color={Colors.textSecondary} />
                        <Text style={styles.txDate}>{new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                </View>
                <Text style={[styles.txAmount, isCredit ? styles.creditText : styles.debitText]}>
                    {isCredit ? '+' : '-'}{item.amount.toLocaleString('fr-FR')} F
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transactions</Text>
                <View style={{ width: 44 }} />
            </View>

            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Aucune transaction trouvée.</Text>
                        </View>
                    }
                />
            )}
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
        paddingBottom: 20,
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
    loadingBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 20,
    },
    txCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        elevation: 2,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    creditIcon: {
        backgroundColor: '#DCFCE7',
    },
    debitIcon: {
        backgroundColor: '#FEE2E2',
    },
    txContent: {
        flex: 1,
        marginLeft: 12,
    },
    txTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    txDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    txDate: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginLeft: 4,
    },
    txAmount: {
        fontSize: 16,
        fontWeight: '900',
    },
    creditText: {
        color: '#16A34A',
    },
    debitText: {
        color: '#DC2626',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    }
});
