import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RefineIdea() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [step1, setStep1] = useState("");
  const [step2, setStep2] = useState("");
  const [step3, setStep3] = useState("");
  const [step4, setStep4] = useState("");
  const [step5, setStep5] = useState("");
  const [step6, setStep6] = useState("");

  useEffect(() => {
    if (!id) return;

    const loadRefinement = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (!token) throw new Error("Not authenticated");

        const res = await fetch(`/api/projects/refinement?id=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json();
        const r = json?.refinement || {};

        setStep1(r.step_1 || "");
        setStep2(r.step_2 || "");
        setStep3(r.step_3 || "");
        setStep4(r.step_4 || "");
        setStep5(r.step_5 || "");
        setStep6(r.step_6 || "");

        if (
          r.step_1 &&
          r.step_2 &&
          r.step_3 &&
          r.step_4 &&
          r.step_5 &&
          r.step_6
        ) {
          setCompleted(true);
        } else if (r.step_1 && r.step_2 && r.step_3 && r.step_4 && r.step_5) {
          setCurrentStep(6);
        } else if (r.step_1 && r.step_2 && r.step_3 && r.step_4) {
          setCurrentStep(5);
        } else if (r.step_1 && r.step_2 && r.step_3) {
          setCurrentStep(4);
        } else if (r.step_1 && r.step_2) {
          setCurrentStep(3);
        } else if (r.step_1) {
          setCurrentStep(2);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadRefinement();
  }, [id]);

  async function saveStep(step, value) {
    setSaving(true);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/projects/update-audience", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, step, value }),
      });

      if (!res.ok) throw new Error("Save failed");

      if (step === 1) setCurrentStep(2);
      if (step === 2) setCurrentStep(3);
      if (step === 3) setCurrentStep(4);
      if (step === 4) setCurrentStep(5);
      if (step === 5) setCurrentStep(6);
      if (step === 6) setCompleted(true);
    } catch (err) {
      console.error(err);
      alert("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Loading…</div>;
  }

  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      <h1>Refine your idea</h1>

      {completed && (
        <div style={{ marginTop: 30 }}>
          <h2>✅ Refinement complete</h2>
          <p>Your idea is now fully refined.</p>
          <button onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      )}

      {!completed && currentStep === 1 && (
        <section style={{ marginTop: 24 }}>
          <h2>Step 1: Who is this idea for?</h2>
          <textarea
            value={step1}
            onChange={(e) => setStep1(e.target.value)}
            rows={6}
            style={{ width: "100%", padding: 12 }}
          />
          <button
            disabled={saving || !step1.trim()}
            onClick={() => saveStep(1, step1)}
            style={{ marginTop: 16 }}
          >
            Continue to Step 2
          </button>
        </section>
      )}

      {!completed && currentStep === 2 && (
        <section style={{ marginTop: 24 }}>
          <h2>Step 2: What problem does this solve?</h2>
          <textarea
            value={step2}
            onChange={(e) => setStep2(e.target.value)}
            rows={6}
            style={{ width: "100%", padding: 12 }}
          />
          <button
            disabled={saving || !step2.trim()}
            onClick={() => saveStep(2, step2)}
            style={{ marginTop: 16 }}
          >
            Continue to Step 3
          </button>
        </section>
      )}

      {!completed && currentStep === 3 && (
        <section style={{ marginTop: 24 }}>
          <h2>Step 3: Why is this better than existing solutions?</h2>
          <textarea
            value={step3}
            onChange={(e) => setStep3(e.target.value)}
            rows={6}
            style={{ width: "100%", padding: 12 }}
          />
          <button
            disabled={saving || !step3.trim()}
            onClick={() => saveStep(3, step3)}
            style={{ marginTop: 16 }}
          >
            Continue to Step 4
          </button>
        </section>
      )}

      {!completed && currentStep === 4 && (
        <section style={{ marginTop: 24 }}>
          <h2>Step 4: What is the core value proposition?</h2>
          <textarea
            value={step4}
            onChange={(e) => setStep4(e.target.value)}
            rows={6}
            style={{ width: "100%", padding: 12 }}
          />
          <button
            disabled={saving || !step4.trim()}
            onClick={() => saveStep(4, step4)}
            style={{ marginTop: 16 }}
          >
            Continue to Step 5
          </button>
        </section>
      )}

      {!completed && currentStep === 5 && (
        <section style={{ marginTop: 24 }}>
          <h2>Step 5: What could go wrong with this idea?</h2>
          <textarea
            value={step5}
            onChange={(e) => setStep5(e.target.value)}
            rows={6}
            style={{ width: "100%", padding: 12 }}
          />
          <button
            disabled={saving || !step5.trim()}
            onClick={() => saveStep(5, step5)}
            style={{ marginTop: 16 }}
          >
            Continue to Step 6
          </button>
        </section>
      )}

      {!completed && currentStep === 6 && (
        <section style={{ marginTop: 24 }}>
          <h2>
            Step 6: What is the simplest version of this idea you could try first?
          </h2>
          <textarea
            value={step6}
            onChange={(e) => setStep6(e.target.value)}
            rows={6}
            style={{ width: "100%", padding: 12 }}
          />
          <button
            disabled={saving || !step6.trim()}
            onClick={() => saveStep(6, step6)}
            style={{ marginTop: 16 }}
          >
            Finish Refinement
          </button>
        </section>
      )}
    </div>
  );
}
