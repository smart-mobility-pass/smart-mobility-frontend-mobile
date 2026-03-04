/**
 * Service API pour Smart Mobility
 * Centralise les appels vers les microservices Spring Boot
 */

import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://192.168.16.104'; // Mise à jour avec votre IP locale
const GATEWAY_PORT = '8765';

export const ENDPOINTS = {
    AUTH: `${BASE_URL}:8080`,
    USER_PASS: `${BASE_URL}:${GATEWAY_PORT}/users`,
    TRIP_MGMT: `${BASE_URL}:${GATEWAY_PORT}/trips`,
    PRICING: `${BASE_URL}:${GATEWAY_PORT}/api/pricing`,
    ACCOUNT: `${BASE_URL}:${GATEWAY_PORT}/accounts`,
    CATALOG: `${BASE_URL}:${GATEWAY_PORT}/api/catalog`,
};

// Gestionnaires pour le rafraîchissement des tokens
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });
    failedQueue = [];
};

export const refreshAccessToken = async (): Promise<string> => {
    try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token available');

        const response = await fetch(`${ENDPOINTS.AUTH}/realms/smart-mobility/protocol/openid-connect/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `client_id=smart-mobility-app&grant_type=refresh_token&refresh_token=${refreshToken}`,
        });

        if (!response.ok) {
            throw new Error('Refresh token invalid or expired');
        }

        const data = await response.json();

        await SecureStore.setItemAsync('userToken', data.access_token);
        if (data.refresh_token) {
            await SecureStore.setItemAsync('refreshToken', data.refresh_token);
        }

        return data.access_token;
    } catch (error) {
        // En cas d'échec, on nettoie pour forcer la reconnexion
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('refreshToken');
        throw error;
    }
};

export const apiClient = async (url: string, options: RequestInit = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        console.log(`[API] Fetching: ${url}`);
        const token = await SecureStore.getItemAsync('userToken');

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Interception 401 pour rafraîchir le token
        if (response.status === 401 && !url.includes('/token')) {
            console.log(`[API] 401 Unauthorized for ${url}, attempting to refresh token...`);

            if (!isRefreshing) {
                isRefreshing = true;
                refreshAccessToken()
                    .then(newToken => {
                        isRefreshing = false;
                        processQueue(null, newToken);
                    })
                    .catch(err => {
                        isRefreshing = false;
                        processQueue(err, null);
                    });
            }

            return new Promise((resolve, reject) => {
                failedQueue.push({
                    resolve: async (newToken: string) => {
                        try {
                            console.log(`[API] Retrying request with new token: ${url}`);
                            const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
                            const retryResponse = await fetch(url, {
                                ...options,
                                headers: retryHeaders,
                            });

                            if (!retryResponse.ok) {
                                const errorText = await retryResponse.text();
                                reject(new Error(`Erreur ${retryResponse.status}: ${errorText || 'Inconnue'}`));
                                return;
                            }

                            const responseText = await retryResponse.text();
                            resolve(responseText ? JSON.parse(responseText) : null);
                        } catch (e) {
                            reject(e);
                        }
                    },
                    reject: (err) => {
                        reject(err);
                    }
                });
            });
        }

        console.log(`[API] Success [${response.status}]: ${url}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API] Error Body [${url}]:`, errorText);
            throw new Error(`Erreur ${response.status}: ${errorText || 'Inconnue'}`);
        }

        const responseText = await response.text();
        return responseText ? JSON.parse(responseText) : null;
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error(`[API] Timeout for: ${url}`);
            throw new Error('Le serveur ne répond pas (Timeout)');
        }
        console.error(`[API] Global Error [${url}]:`, error);
        throw error;
    }
};

// --- SERVICES SPECIFIQUES ---

export const JourneyService = {
    // Détecter si un trajet est déjà en cours au démarrage
    getActiveJourney: async (userId: string) => {
        return apiClient(`${ENDPOINTS.TRIP_MGMT}/active/${userId}`);
    },

    // Récupérer l'historique complet
    getHistory: async (userId: string) => {
        return apiClient(`${ENDPOINTS.TRIP_MGMT}/history/${userId}`);
    },

    // Check-in : Scan QR Code au début
    // NOTE: Backend attend userId, transportType, startLocation, transportLineId en @RequestParam
    checkIn: async (userId: string, transportType: string, startLocation: string, transportLineId: number) => {
        const url = `${ENDPOINTS.TRIP_MGMT}/start?userId=${userId}&transportType=${transportType}&startLocation=${encodeURIComponent(startLocation)}&transportLineId=${transportLineId}`;
        return apiClient(url, { method: 'POST' });
    },

    // Check-out : Scan QR Code à la fin
    // NOTE: Backend attend endLocation, transportLineId en @RequestParam
    checkOut: async (tripId: number, endLocation: string, transportLineId: number) => {
        const url = `${ENDPOINTS.TRIP_MGMT}/complete/${tripId}?endLocation=${encodeURIComponent(endLocation)}&transportLineId=${transportLineId}`;
        return apiClient(url, { method: 'PUT' });
    },

    // Récupérer un trajet par son ID
    getJourney: async (tripId: number) => {
        return apiClient(`${ENDPOINTS.TRIP_MGMT}/${tripId}`);
    }
};

export const BillingService = {
    // Récupérer le solde et les dépenses journalières
    getAccount: async (userId: string) => {
        return apiClient(`${ENDPOINTS.ACCOUNT}/${userId}`);
    },

    // Recharger le compte
    topUp: async (userId: string, amount: number, description: string) => {
        return apiClient(`${ENDPOINTS.ACCOUNT}/${userId}/topup`, {
            method: 'POST',
            body: JSON.stringify({ amount, description }),
        });
    },

    // Récupérer l'historique des transactions
    getTransactions: async (userId: string) => {
        return apiClient(`${ENDPOINTS.ACCOUNT}/${userId}/transactions`);
    }
};

export const UserService = {
    // Récupérer le solde et les infos utilisateur (Ancien) -> À nettoyer plus tard si plus utilisé
    getProfile: async (userId: string) => {
        return apiClient(`${ENDPOINTS.USER_PASS}/${userId}`);
    },

    // Renouveler abonnement
    renewPass: async (userId: string, packageId: string, paymentMethod: string) => {
        return apiClient(`${ENDPOINTS.USER_PASS}/passes/renew`, {
            method: 'POST',
            body: JSON.stringify({ userId, packageId, paymentMethod }),
        });
    },

    // Récupérer le résumé complet (pass + abonnements + dailyCap)
    getSummary: async (userId: string) => {
        return apiClient(`${ENDPOINTS.USER_PASS}/summary/me`);
    }
};

export const PricingService = {
    getPricingByTripId: async (tripId: number) => {
        return apiClient(`${ENDPOINTS.PRICING}/trip/${tripId}`);
    }
};

export const CatalogService = {
    // Récupérer le catalogue d'abonnement
    getCatalogSubscription: async () => {
        return apiClient(`${ENDPOINTS.CATALOG}/subscription-offers`);
    },

    // Récupérer le catalogue de pass
    getCatalogPass: async () => {
        return apiClient(`${ENDPOINTS.CATALOG}/pass-offers`);
    }
};

