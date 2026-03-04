import React, { createContext, useContext, useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiClient, ENDPOINTS } from '../services/api';

// Indispensable pour que le navigateur se ferme après le login
WebBrowser.maybeCompleteAuthSession();

// Configuration Keycloak (À adapter selon l'IP locale)
const KEYCLOAK_BASE_URL = 'http://192.168.16.104:8080'; // Mise à jour avec votre IP
const REALM = 'smart-mobility';
const CLIENT_ID = 'smart-mobility-app';

const discovery = {
    authorizationEndpoint: `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/auth`,
    tokenEndpoint: `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/token`,
    revocationEndpoint: `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/revoke`,
    endSessionEndpoint: `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/logout`,
};

interface AuthContextType {
    token: string | null;
    user: any | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [processedCode, setProcessedCode] = useState<string | null>(null);

    // Hook d'authentification Expo
    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: CLIENT_ID,
            redirectUri: AuthSession.makeRedirectUri({
                scheme: 'smartmobilityapp'
            }),
            scopes: ['openid', 'profile', 'email', 'offline_access'],
            usePKCE: true,
        },
        discovery
    );

    // Charger le token au démarrage
    useEffect(() => {
        async function loadStoredToken() {
            try {
                console.log("Auth: Starting initial token load...");
                const storedToken = await SecureStore.getItemAsync('userToken');
                if (storedToken) {
                    console.log("Auth: Stored token found, syncing profile...");
                    setToken(storedToken);
                    await syncUserProfile();
                } else {
                    console.log("Auth: No stored token found.");
                }
            } catch (e) {
                console.error("Auth: load token failed", e);
            } finally {
                console.log("Auth: Initial load finished, releasing loader.");
                setIsLoading(false);
            }
        }
        loadStoredToken();
    }, []);

    const syncUserProfile = async () => {
        try {
            console.log("Auth: Syncing user profile from Gateway...");
            // L'appel à /summary/me récupère le profil + le pass + le solde
            const userData = await apiClient(`${ENDPOINTS.USER_PASS}/summary/me`);
            console.log("Auth: User profile synced successfully", userData.firstName);
            // On standardise l'ID pour le front-end
            setUser({ ...userData, id: userData.keycloakId });
        } catch (error) {
            console.error("Auth: Failed to sync user profile", error);
            // Si le token est invalide ou expiré, on déconnecte
            if (token) logout();
        }
    };

    // Gérer la réponse de Keycloak
    useEffect(() => {
        if (response?.type === 'success') {
            const { code } = response.params;
            if (code && code !== processedCode) {
                console.log("Auth: Code received from Keycloak, starting exchange...");
                setProcessedCode(code);
                handleExchangeCode(code);
            }
        } else if (response?.type === 'error' || response?.type === 'cancel') {
            console.log("Auth: Login cancelled or failed", response.type);
            setIsLoading(false);
        }
    }, [response, processedCode]);

    const handleExchangeCode = async (code: string) => {
        try {
            setIsLoading(true);
            const tokenResult = await AuthSession.exchangeCodeAsync(
                {
                    clientId: CLIENT_ID,
                    code,
                    redirectUri: AuthSession.makeRedirectUri({
                        scheme: 'smartmobilityapp'
                    }),
                    extraParams: {
                        ...(request?.codeVerifier ? { code_verifier: request.codeVerifier } : {}),
                        scope: 'openid profile email offline_access'
                    },
                },
                discovery
            );

            if (tokenResult.accessToken) {
                console.log("Auth: Access token obtained, storing and syncing...");
                await SecureStore.setItemAsync('userToken', tokenResult.accessToken);

                if (tokenResult.refreshToken) {
                    await SecureStore.setItemAsync('refreshToken', tokenResult.refreshToken);
                }

                setToken(tokenResult.accessToken);
                // Synchronisation JIT immédiate avec le backend métier
                await syncUserProfile();
                console.log("Auth: Authentication flow completed.");
            } else {
                console.warn("Auth: No access token in result", tokenResult);
            }
        } catch (error) {
            console.error("Code exchange failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async () => {
        await promptAsync();
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('refreshToken');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            token,
            user,
            isAuthenticated: !!token,
            isLoading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
