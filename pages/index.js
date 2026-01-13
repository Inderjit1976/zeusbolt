import Link from "next/link";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "64px 32px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {/* BRAND */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          lineHeight: 1,
        }}
      >
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0 }}>
          ZeusBolt
        </h1>

        <img
          src="/zeusbolt-underline.png"
          alt="ZeusBolt underline lightning bolt"
          style={{
            width: 220,
            height: "auto",
            marginTop: 6,
            display: "block",
          }}
        />
      </div>

      {/* HERO */}
      <div style={{ marginTop: 48, maxWidth: 640 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700 }}>
          Build, manage, and scale your apps — faster.
        </h2>

        <p style={{ fontSize: 18, lineHeight: 1.6, marginTop: 16 }}>
          ZeusBolt is a modern platform for turning ideas into production-ready
          applications with authentication, payments, and infrastructure
          handled for you.
        </p>

        <div style={{ marginTop: 32 }}>
          <Link href="/auth">
            <button
              style={{
                padding: "12px 20px",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Get started
            </button>
          </Link>

          <Link href="/dashboard" style={{ marginLeft: 16 }}>
            Go to dashboard
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <div
        style={{
          marginTop: 12
