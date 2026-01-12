import { useEffect, useState } from "react";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔴 FORCE loading to stop after 1 second
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <p style={{ padding: 20 }}>Loading dashboard…</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>ZeusBolt Dashboard</h1>
      <p>React is working. useEffect executed ✅</p>
    </div>
  );
}
