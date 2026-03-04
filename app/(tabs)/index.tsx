import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, Bus, Info, ArrowRight, Plus, Route, Search, Train, Wallet, Zap, Clock, Banknote } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, NativeScrollEvent, NativeSyntheticEvent, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, RefreshControl } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BillingService, JourneyService, UserService } from '../../services/api';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 48;

const ADVERTISEMENTS = [
  {
    id: '1',
    image: require('../../assets/promo.png'),
    title: 'TER : Un voyage serein',
    description: 'Confort premium première classe.',
    badge: 'Expérience TER'
  },
  {
    id: '2',
    image: require('../../assets/promo_brt.png'),
    title: 'BRT : Rapidité absolue',
    description: 'Gagnez du temps sur vos trajets.',
    badge: 'Vitesse BRT'
  },
  {
    id: '3',
    image: require('../../assets/promo_bus.png'),
    title: 'Bus : Partout avec vous',
    description: 'Le plus grand réseau urbain.',
    badge: 'Accessibilité Bus'
  }
];

import { useAuth } from '../../context/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // States
  const [balance, setBalance] = useState<number>(0);
  const [summary, setSummary] = useState<any>(null);
  const [dailySpent, setDailySpent] = useState<number>(0);
  const [tripsToday, setTripsToday] = useState<number>(0);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const displayUser = {
    name: user ? `${user.firstName} ${user.lastName}` : 'Utilisateur',
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user || authLoading) return;
      try {
        // Fetch financial data from Billing-Service
        const acct = await BillingService.getAccount(user.id);
        setBalance(acct.balance || 0);
        setDailySpent(acct.dailySpent || 0);

        // Fetch Summary from User-Service (Daily Cap, Active Pass, Subs)
        const userSummary = await UserService.getSummary(user.id);
        setSummary(userSummary);

        // Fetch Today's trips count
        const history = await JourneyService.getHistory(user.id);
        const today = new Date().toISOString().split('T')[0];
        const count = (history || []).filter((t: any) => t.startTime && t.startTime.startsWith(today)).length;
        setTripsToday(count || 0);

        // Fetch active trip from Trip-Management
        const trip = await JourneyService.getActiveJourney(user.id);
        setActiveTrip(trip && trip.id ? trip : null);
      } catch (error) {
        console.error("Home: Failed to fetch dashboard data", error);
      }
    };
    fetchData();

    // Polling every 15s
    const dataInterval = setInterval(fetchData, 15000);
    return () => clearInterval(dataInterval);
  }, [user, authLoading]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    const fetchData = async () => {
      if (!user) return;
      try {
        const acct = await BillingService.getAccount(user.id);
        setBalance(acct.balance || 0);
        setDailySpent(acct.dailySpent || 0);
        const userSummary = await UserService.getSummary(user.id);
        setSummary(userSummary);
        const history = await JourneyService.getHistory(user.id);
        const today = new Date().toISOString().split('T')[0];
        const count = (history || []).filter((t: any) => t.startTime && t.startTime.startsWith(today)).length;
        setTripsToday(count || 0);
        const trip = await JourneyService.getActiveJourney(user.id);
        setActiveTrip(trip && trip.id ? trip : null);
      } catch (error) {
        console.error("Home: Failed refresh", error);
      } finally {
        setRefreshing(false);
      }
    };
    fetchData();
  }, [user]);


  useEffect(() => {
    const timer = setInterval(() => {
      let nextSlide = (activeSlide + 1) % ADVERTISEMENTS.length;
      setActiveSlide(nextSlide);
      flatListRef.current?.scrollToIndex({ index: nextSlide, animated: true });
    }, 5000);

    return () => clearInterval(timer);
  }, [activeSlide]);

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveSlide(roundIndex);
  };

  const renderPromoItem = ({ item }: { item: typeof ADVERTISEMENTS[0] }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.promoCard, { width: SLIDER_WIDTH }]}
    >
      <Image source={item.image} style={styles.promoImage} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.promoOverlay}
      >
        <View style={styles.promoBadge}>
          <Info size={12} color={Colors.white} />
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
        <Text style={styles.promoTitle}>{item.title}</Text>
        <Text style={styles.promoDesc}>{item.description}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.white} />
        }
      >

        {/* Header Smart Mobility */}
        <View style={styles.header}>
          <View style={styles.topRow}>
            <View style={styles.logoAndTitle}>
              <View style={styles.logoCircle}>
                <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.logoText}>Smart</Text>
                <Text style={styles.logoTextBold}>Mobility</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/pricing_info')}>
              <Info size={22} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications')}>
              <Bell size={22} color={Colors.white} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>

          {/* Salutation & Recherche */}
          <View style={styles.greetingContainer}>
            <Text style={styles.welcomeText}>Bonjour, {authLoading ? '...' : displayUser.name.split(' ')[0]}</Text>
            <Text style={styles.whereToText}>Où allons-nous aujourd'hui ?</Text>
          </View>

        </View>

        {/* Portefeuille & Dépenses - Redesigned for better spacing */}
        <View style={styles.statsWrapper}>
          <View style={styles.mainStatsCard}>
            <View style={styles.statsHeader}>
              <View style={styles.balanceInfo}>
                <View style={styles.statIconBox}>
                  <Wallet size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.statLabelMain}>Plafond (Cap)</Text>
                  <Text style={[styles.statValueMain, styles.balanceValue]}>{authLoading ? '...' : (summary?.dailyCap || 2500).toLocaleString('fr-FR')} F</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.topUpBtnLarge} onPress={() => router.push('/recharge')}>
                <Plus size={20} color={Colors.white} />
                <Text style={styles.topUpBtnText}>Recharger</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mainDividerHorizontal} />

            <View style={styles.statsFooter}>
              <View style={styles.tripInfo}>
                <View style={styles.statIconBoxLight}>
                  <Banknote size={20} color="#FF9933" />
                </View>
                <View>
                  <Text style={styles.statLabelMain}>Dépense (Today)</Text>
                  <Text style={styles.statValueMain}>{authLoading ? '...' : dailySpent.toLocaleString('fr-FR')} F</Text>
                </View>
              </View>

              <View style={styles.statDividerVertical} />

              <View style={styles.tripCountInfo}>
                <View style={styles.statIconBoxTrips}>
                  <Route size={20} color="#10B981" />
                </View>
                <View>
                  <Text style={styles.statLabelMain}>Trajets</Text>
                  <Text style={styles.statValueMain}>{authLoading ? '...' : tripsToday}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>

          {activeTrip && (
            <TouchableOpacity activeOpacity={0.8} style={styles.activeTripBanner} onPress={() => router.push('/explore')}>
              <View style={styles.activeTripIcon}>
                <Clock size={24} color={Colors.white} />
              </View>
              <View style={styles.activeTripContent}>
                <Text style={styles.activeTripTitle}>Trajet en Cours</Text>
                <Text style={styles.activeTripDesc}>Ligne n°{activeTrip.transportLineId} • Départ: {activeTrip.startLocation}</Text>
              </View>
              <View style={styles.activeTripAction}>
                <Text style={styles.activeTripActionText}>TERMINER</Text>
                <ArrowRight size={16} color={Colors.white} />
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={ADVERTISEMENTS}
              renderItem={renderPromoItem}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onMomentumScrollEnd}
              snapToAlignment="center"
              decelerationRate="fast"
            />
            <View style={styles.pagination}>
              {ADVERTISEMENTS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    { backgroundColor: activeSlide === index ? Colors.primary : 'rgba(255,255,255,0.3)' },
                    activeSlide === index && styles.activeDot
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Active Pass & Subscriptions Section */}
          {(summary?.hasActivePass || (summary?.activeSubscriptions && summary.activeSubscriptions.length > 0)) && (
            <View style={styles.perksContainer}>
              <View style={styles.selectionTitleContainer}>
                <Text style={styles.sectionTitle}>Mes Avantages Actifs</Text>
              </View>

              {summary.hasActivePass && (
                <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.perkCard}>
                  <Zap size={24} color={Colors.white} />
                  <View style={styles.perkContent}>
                    <Text style={styles.perkTitle}>Pass Mobilité Actif</Text>
                    <Text style={styles.perkDesc}>{summary.passType} • Statut: {summary.passStatus}</Text>
                  </View>
                  <View style={styles.perkBadge}>
                    <Text style={styles.perkBadgeText}>ILLIMITÉ</Text>
                  </View>
                </LinearGradient>
              )}

              {summary.activeSubscriptions?.map((sub: any, idx: number) => (
                <LinearGradient key={idx} colors={['#EC4899', '#DB2777']} style={styles.perkCard}>
                  <Train size={24} color={Colors.white} />
                  <View style={styles.perkContent}>
                    <Text style={styles.perkTitle}>{sub.offerName}</Text>
                    <Text style={styles.perkDesc}>{sub.subscriptionType} • -{sub.discountPercentage}% sur {sub.applicableTransport}</Text>
                  </View>
                  <View style={styles.perkBadge}>
                    <Text style={styles.perkBadgeText}>ACTIF</Text>
                  </View>
                </LinearGradient>
              ))}
            </View>
          )}

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
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingTop: 45,
    paddingBottom: 60,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.white,
    padding: 6,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '400',
    marginBottom: -4,
  },
  logoTextBold: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.white,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  greetingContainer: {
    marginBottom: 24,
  },
  welcomeText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  whereToText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  statsWrapper: {
    marginTop: -35,
    paddingHorizontal: 24,
  },
  mainStatsCard: {
    backgroundColor: Colors.white,
    borderRadius: 32,
    padding: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  mainDividerHorizontal: {
    height: 1,
    backgroundColor: '#F1F5F9',
    width: '100%',
  },
  statDividerVertical: {
    width: 1,
    height: 24,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 12,
  },
  balanceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statIconBoxLight: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statLabelMain: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValueMain: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  balanceValue: {
    color: Colors.primary,
  },
  tripCountInfo: {
    flex: 0.8,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  statIconBoxTrips: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  perksContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
  perkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  perkContent: {
    flex: 1,
    marginLeft: 16,
  },
  perkTitle: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
  },
  perkDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  perkBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  perkBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  topUpBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    elevation: 4,
  },
  topUpBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  carouselContainer: {
    marginVertical: 16,
    borderRadius: 24,
    overflow: 'hidden',
    height: 140,
  },
  promoCard: {
    height: 140,
    backgroundColor: '#000',
  },
  promoImage: {
    width: '100%',
    height: '100%',
    opacity: 0.75,
  },
  promoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    justifyContent: 'flex-end',
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  promoTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  promoDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  pagination: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    flexDirection: 'row',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },
  activeDot: {
    width: 12,
  },
  selectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text,
  },
  activeTripBanner: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  activeTripIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activeTripContent: {
    flex: 1,
  },
  activeTripTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  activeTripDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  activeTripAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  activeTripActionText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '900',
    marginRight: 4,
  }
});