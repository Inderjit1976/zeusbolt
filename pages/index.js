import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "48px 32px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {/* HERO */}
      <div style={{ marginTop: 32, maxWidth: 700 }}>
        <h2 style={{ fontSize: 30, fontWeight: 700 }}>
          Turn your ideas into production-ready apps.
        </h2>

        <p style={{ fontSize: 18, lineHeight: 1.6, marginTop: 16 }}>
          ZeusBolt helps founders and builders design, structure, and manage
          modern applications — with authentication, billing, and infrastructure
          handled for you.
        </p>

        <div style={{ marginTop: 28 }}>
          <button
            style={{
              padding: "12px 20px",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => router.push("/auth")}
          >
            Get started
          </button>
        </div>
      </div>

      {/* INTERACTIVE TEASER */}
      <div
        style={{
          marginTop: 80,
          padding: "32px",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          maxWidth: 700,
        }}
      >
        <h3 style={{ fontSize: 24, fontWeight: 700 }}>
          Try ZeusBolt now
        </h3>

        <p style={{ marginTop: 12, fontSize: 16, opacity: 0.9 }}>
          Describe your next big idea and see how ZeusBolt can structure it.
        </p>

        <textarea
          placeholder="e.g. A SaaS app for tracking fitness habits with subscriptions..."
          rows={4}
          style={{
            width: "100%",
            marginTop: 16,
            padding: 12,
            fontSize: 16,
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "inherit",
          }}
        />

        <div style={{ marginTop: 16 }}>
          <button
            style={{
              padding: "10px 18px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => router.push("/auth")}
          >
            Generate app structure
          </button>

          <span style={{ marginLeft: 12, fontSize: 14, opacity: 0.7 }}>
            Sign in required
          </span>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div style={{ marginTop: 100, maxWidth: 900 }}>
        <h3 style={{ fontSize: 26, fontWeight: 700 }}>
          Trusted by early builders
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
            marginTop: 32,
          }}
        >
          <div
            style={{
              padding: 20,
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
            }}
          >
            <p>
              “ZeusBolt helped me think clearly about my app before writing a
              single line of code.”
            </p>
            <p style={{ marginTop: 12, fontSize: 14, opacity: 0.7 }}>
              — Early access user
            </p>
          </div>

          <div
            style={{
              padding: 20,
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
            }}
          >
            <p>
              “The idea-to-structure flow is exactly what first-time founders
              need.”
            </p>
            <p style={{ marginTop: 12, fontSize: 14, opacity: 0.7 }}>
              — Private beta tester
            </p>
          </div>

          <div
            style={{
              padding: 20,
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
            }}
          >
            <p>
              “Simple, clean, and focused. ZeusBolt feels like a real product,
              not a demo.”
            </p>
            <p style={{ marginTop: 12, fontSize: 14, opacity: 0.7 }}>
              — Founder preview
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div
        style={{
          marginTop: 120,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          paddingTop: 24,
          fontSize: 14,
          opacity: 0.7,
        }}
      >
        © {new Date().getFullYear()} ZeusBolt
      </div>
    </div>
  );
}
