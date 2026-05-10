/**
 * API Client - Drop-in replacement for Base44 SDK
 * 
 * This module provides the same interface as @base44/sdk but uses
 * our independent backend API instead.
 */

const API_URL ='http://localhost:8081';

// Token management
const getToken = () => localStorage.getItem('inkit_token');
const setToken = (token) => localStorage.setItem('inkit_token', token);
const clearToken = () => localStorage.removeItem('inkit_token');

const normalizeUser = (user) => {
    if (!user || typeof user !== 'object') {
        return user;
    }
    return {
        ...user,
        full_name: user.full_name ?? user.fullName ?? user.name ?? null,
        account_type: user.account_type ?? user.accountType ?? null,
        firm_name: user.firm_name ?? user.firmName ?? null,
        bar_number: user.bar_number ?? user.barNumber ?? null,
        is_active: user.is_active ?? user.isActive ?? null,
        created_date: user.created_date ?? user.createdDate ?? null
    };
};

/**
 * Make an authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        const err = new Error(error.error || 'Request failed');
        err.status = response.status;
        err.data = error;
        throw err;
    }

    if (response.status === 204) {
        return null;
    }

    return response.json().catch(() => null);
};

/**
 * Create an entity API with standard CRUD operations
 * Matches the Base44 SDK entity interface
 */
const createEntityApi = (entityName, config = {}) => {
    const basePath = config.basePath || `/api/${entityName.toLowerCase()}`;
    const createPath = config.createPath || basePath;
    const filterPath = config.filterPath || `${basePath}/filter`;

    return {
        /**
         * List entities with optional sorting
         * @param {string} sortBy - Sort field, prefix with '-' for descending
         * @param {number} limit - Maximum number of records
         */
        list: async (sortBy = '-created_date', limit = 50) => {
            return apiRequest(`${basePath}?limit=${limit}`);
        },

        /**
         * Filter entities with complex conditions
         * @param {object} filter - Filter conditions
         * @param {string} sortBy - Sort field
         * @param {number} limit - Maximum number of records
         */
        filter: async (filter = {}, sortBy = '-created_date', limit = 50) => {
            try {
                return await apiRequest(filterPath, {
                    method: 'POST',
                    body: JSON.stringify({ filter, sortBy, limit })
                });
            } catch (error) {
                // Fallback for backends that do not expose /filter endpoints.
                const rows = await apiRequest(`${basePath}?limit=${limit}`);
                return Array.isArray(rows)
                    ? rows.filter((row) => Object.entries(filter).every(([k, v]) => row?.[k] === v))
                    : [];
            }
        },

        /**
         * Get a single entity by ID
         */
        get: async (id) => {
            return apiRequest(`${basePath}/${id}`);
        },

        /**
         * Create a new entity
         */
        create: async (data) => {
            return apiRequest(createPath, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        /**
         * Update an entity
         */
        update: async (id, data) => {
            return apiRequest(`${basePath}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        /**
         * Delete an entity
         */
        delete: async (id) => {
            return apiRequest(`${basePath}/${id}`, {
                method: 'DELETE'
            });
        }
    };
};

/**
 * Authentication API
 * Matches the Base44 SDK auth interface
 */
const authApi = {
    /**
     * Get current authenticated user
     */
    me: async () => {
        try {
            const user = await apiRequest('/api/users/me');
            return normalizeUser(user);
        } catch {
            const user = await apiRequest('/api/auth/me');
            return normalizeUser(user);
        }
    },

    /**
     * Login with email and password
     */
    login: async (email, password) => {
        const loginEndpoint = '/auth/login';
        const result = await apiRequest(loginEndpoint, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (result.token) {
            setToken(result.token);
        }
        return result.user;
    },

    /**
     * Register a new user
     */
    register: async (userData) => {
        const registerEndpoint = '/auth/register';
        const result = await apiRequest(registerEndpoint, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        // Java backend returns a plain success message from /auth/register.
        // Auto-login after successful registration so callers still receive a user.
        if (result && result.token) {
            setToken(result.token);
            return result.user ?? authApi.me();
        }

        return authApi.login(userData.email, userData.password);
    },

    /**
     * Logout - clears token and optionally redirects
     */
    logout: (redirectUrl = null) => {
        clearToken();
        if (redirectUrl) {
            window.location.href = '/login';
        }
    },

    /**
     * Redirect to login page
     */
    redirectToLogin: (returnUrl = null) => {
        const url = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login';
        window.location.href = url;
    },

    /**
     * Update user profile
     */
    updateProfile: async (data) => {
        return apiRequest('/api/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * Change password
     */
    changePassword: async (currentPassword, newPassword) => {
        return apiRequest('/api/auth/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    }
};

/**
 * Integration APIs
 * Matches the Base44 SDK integrations interface
 */
const integrationsApi = {
    Core: {
        /**
         * Invoke LLM for AI responses
         */
        InvokeLLM: async (params) => {
            return apiRequest('/api/integrations/invoke-llm', {
                method: 'POST',
                body: JSON.stringify(params)
            });
        },

        /**
         * Upload a file
         */
        UploadFile: async ({ file }) => {
            const token = getToken();
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL}/api/integrations/upload-file`, {
                method: 'POST',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            return response.json();
        },

        /**
         * Send email
         */
        SendEmail: async (params) => {
            return apiRequest('/api/integrations/send-email', {
                method: 'POST',
                body: JSON.stringify(params)
            });
        },

        /**
         * Send SMS
         */
        SendSMS: async (params) => {
            return apiRequest('/api/integrations/send-sms', {
                method: 'POST',
                body: JSON.stringify(params)
            });
        },

        /**
         * Generate image (placeholder)
         */
        GenerateImage: async (params) => {
            console.warn('GenerateImage not implemented');
            return { url: '' };
        },

        /**
         * Extract data from uploaded file
         */
        ExtractDataFromUploadedFile: async (params) => {
            return apiRequest('/api/integrations/extract-data', {
                method: 'POST',
                body: JSON.stringify(params)
            });
        }
    }
};

/**
 * Create the API client that mimics Base44 SDK interface
 */
export const createApiClient = (config = {}) => {
    // Config is ignored since we use env vars, but kept for API compatibility

    return {
        auth: authApi,

        entities: {
            Case: {
                ...createEntityApi('cases'),
                findById: async (id) => apiRequest(`/api/cases/${id}`) // Alias for get
            },
            Document: createEntityApi('documents'),
            Hearing: createEntityApi('hearings'),
            Task: createEntityApi('tasks'),
            Invoice: createEntityApi('invoices'),
            Invitation: createEntityApi('invitations'),
            CaseAssignment: {
                ...createEntityApi('assignments/cases'),
                // Override list to use GET
                list: async (sortBy, limit) => apiRequest('/api/assignments/cases'),
                filter: async (filter) => apiRequest('/api/assignments/cases/filter', {
                    method: 'POST',
                    body: JSON.stringify({ filter })
                })
            },
            TaskAssignment: {
                ...createEntityApi('assignments/tasks'),
                list: async () => apiRequest('/api/assignments/tasks'),
                filter: async (filter) => apiRequest('/api/assignments/tasks/filter', {
                    method: 'POST',
                    body: JSON.stringify({ filter })
                })
            },
            LibraryDocument: createEntityApi('library'),
            ResearchQuery: createEntityApi('research'),
            Snippet: createEntityApi('snippets'),
            User: {
                ...createEntityApi('users', { basePath: '/api/users' }),
                // User filter is commonly used
                filter: async (filter, sortBy = '-created_date', limit = 50) => {
                    try {
                        return await apiRequest('/api/users/filter', {
                            method: 'POST',
                            body: JSON.stringify({ filter, sortBy, limit })
                        });
                    } catch {
                        const users = await apiRequest(`/api/users?limit=${limit}`);
                        return Array.isArray(users)
                            ? users.filter((row) => Object.entries(filter || {}).every(([k, v]) => row?.[k] === v))
                            : [];
                    }
                }
            },
            Client: createEntityApi('clients', {
                basePath: '/api/clients',
                createPath: '/api/client'
            })
        },

        integrations: integrationsApi
    };
};

// Export default instance
export const api = createApiClient();
