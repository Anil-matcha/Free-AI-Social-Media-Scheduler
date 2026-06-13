import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const ApiContext = createContext();

// Next.js rewrites will proxy /api to http://localhost:8000/api
const BASE_URL = "http://127.0.0.1:8000";

export function ApiProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // We mock a constant API key to satisfy components that might check for it
  const apiKey = "server-side-key"; 

  const fetchUserData = useCallback(async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/api/v1/creative-agent/account/balance`);
      setUserData({
        username: data.email?.split("@")[0] || "User",
        balance: data.balance || 0,
        email: data.email,
      });
    } catch (err) {
      console.error("Failed to fetch user data via proxy", err);
      // The backend will return an error if MU_API_KEY is missing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return (
    <ApiContext.Provider value={{ apiKey, userData, loading, fetchUserData }}>
      {children}
    </ApiContext.Provider>
  );
}

export const useApi = () => useContext(ApiContext);
