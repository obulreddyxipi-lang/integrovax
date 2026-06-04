import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:40005/sap";

export const fetchLogs = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/logs`); // 🚀 Working fine!
    return res.data?.data || [];
  } catch (err) {
    console.error("API Error fetching logs:", err.message);
    return [];
  }
};

// Update this function to match the exact same concatenation layout:
export const fetchPackagesWithIflows = async () => {
  try {
    // FIX: Change this line to append only '/packages-with-iflows'
    const res = await axios.get(`${BASE_URL}/packages-with-iflows`); 
    
    return res.data?.data || [];
  } catch (err) {
    console.error("API Error fetching packages with iflows:", err.message);
    return [];
  }
};
