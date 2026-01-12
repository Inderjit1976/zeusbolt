export default function Dashboard() {
  return (
    <div style={{ padding: 20 }}>
      <h1>ZeusBolt Dashboard</h1>

      <p style={{ color: "blue", fontWeight: "bold" }}>
        DEPLOYMENT FINGERPRINT: 2026-01-12T14:30Z
      </p>

      <p>
        If you can see this exact timestamp, you are on the correct deployment.
      </p>
    </div>
  );
}
