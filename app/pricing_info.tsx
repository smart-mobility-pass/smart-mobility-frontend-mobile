import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { ArrowLeft, Info, Bus, Train, Zap, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function PricingInfoScreen() {
    const router = useRouter();

    const PricingCard = ({ type, icon: Icon, color, base, perZone, zonesInfo }: any) => (
        <View style={styles.card}>
            <View style={[styles.iconHeader, { backgroundColor: color }]}>
                <Icon size={24} color={Colors.white} />
                <Text style={styles.typeText}>{type}</Text>
            </View>
            <View style={styles.cardBody}>
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Prix de base</Text>
                    <Text style={styles.priceValue}>{base} F</Text>
                </View>
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Supplément Zone</Text>
                    <Text style={styles.priceValue}>+{perZone} F</Text>
                </View>
                <View style={styles.divider} />
                <Text style={styles.zonesInfo}>{zonesInfo}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tarification & Détails</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.introBox}>
                    <Info size={20} color={Colors.primary} />
                    <Text style={styles.introText}>
                        Smart Mobility utilise une tarification dynamique basée sur les zones traversées et votre statut d'abonné.
                    </Text>
                </View>

                <PricingCard
                    type="BUS (Dakar Dem Dikk)"
                    icon={Bus}
                    color="#3B82F6"
                    base={150}
                    perZone={50}
                    zonesInfo="Traversée d'une zone supplémentaire : +50 F. Max 500 F."
                />

                <PricingCard
                    type="TER (Train Express)"
                    icon={Train}
                    color="#6366F1"
                    base={500}
                    perZone={500}
                    zonesInfo="Passe de zone 1 à 2 : 1000 F. Passe de zone 2 à 3 : 1500 F. Max 2500 F."
                />

                <PricingCard
                    type="BRT (Rapid Transit)"
                    icon={Zap}
                    color="#F59E0B"
                    base={400}
                    perZone={100}
                    zonesInfo="Trajet intra-zone : 400 F. Trajet inter-zone : 500 F fixe."
                />

                <View style={styles.rulesSection}>
                    <Text style={styles.sectionTitle}>Règles Spéciales</Text>

                    <View style={styles.ruleItem}>
                        <ShieldCheck size={20} color="#10B981" />
                        <View style={styles.ruleTextContent}>
                            <Text style={styles.ruleTitle}>Plafond Journalier (Daily Cap)</Text>
                            <Text style={styles.ruleDesc}>Une fois que vos dépenses atteignent 2500 F, tous vos trajets suivants sont GRATUITS pour le reste de la journée.</Text>
                        </View>
                    </View>

                    <View style={styles.ruleItem}>
                        <Info size={20} color="#6366F1" />
                        <View style={styles.ruleTextContent}>
                            <Text style={styles.ruleTitle}>Abonnements & Réductions</Text>
                            <Text style={styles.ruleDesc}>Les abonnés bénéficient de -20% à -50% sur les prix de base selon leur type de contrat.</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
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
    introBox: {
        flexDirection: 'row',
        backgroundColor: '#E0F2FE',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 24,
    },
    introText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 13,
        color: Colors.text,
        lineHeight: 20,
        fontWeight: '500',
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    iconHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    typeText: {
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.white,
    },
    cardBody: {
        padding: 20,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    priceLabel: {
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    priceValue: {
        color: Colors.text,
        fontWeight: '800',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    zonesInfo: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontStyle: 'italic',
        lineHeight: 18,
    },
    rulesSection: {
        marginTop: 12,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 20,
    },
    ruleItem: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        padding: 20,
        borderRadius: 24,
        marginBottom: 16,
        alignItems: 'center',
        elevation: 2,
    },
    ruleTextContent: {
        flex: 1,
        marginLeft: 16,
    },
    ruleTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 4,
    },
    ruleDesc: {
        fontSize: 12,
        color: Colors.textSecondary,
        lineHeight: 18,
    }
});
