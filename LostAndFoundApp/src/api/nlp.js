/**
 * NLP API
 *
 * Used to warm up the backend NLP model on app startup.
 */

import apiClient from "./client";
import { ENDPOINTS } from "../constants";

export const nlpAPI = {
  warmup: () => apiClient.get(ENDPOINTS.NLP_WARMUP),
};
