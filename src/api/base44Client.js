/**
 * Base44 Client Compatibility Layer
 * 
 * This file replaces the original Base44 SDK client with our custom API client.
 * The exported `base44` object provides the same interface for backward compatibility.
 */

import { createApiClient } from './apiClient.js';

// Create the API client instance
// This provides the same interface as the old Base44 SDK:
// - base44.auth.me(), base44.auth.login(), base44.auth.logout()
// - base44.entities.Case.list(), base44.entities.Case.filter(), etc.
// - base44.integrations.Core.InvokeLLM(), etc.
export const base44 = createApiClient();
