import { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:40005/sap";

export default function useLogs(auto = true) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/logs`);
      setLogs(res.data?.data || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();

    if (!auto) return;

    const t = setInterval(loadLogs, 10000);
    return () => clearInterval(t);
  }, [auto]);

  return { logs, loading, reload: loadLogs };
}
