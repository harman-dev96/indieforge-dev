import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api } from "../lib/api";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("polling");
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!sessionId) { setStatus("error"); return; }
    let attempts = 0; let stopped = false;
    const poll = async () => {
      if (stopped || attempts >= 8) { if (!stopped) setStatus("timeout"); return; }
      attempts++;
      try {
        const { data } = await api.get(`/checkout/status/${sessionId}`);
        setData(data);
        if (data.payment_status === "paid") { setStatus("paid"); return; }
        if (data.status === "expired") { setStatus("expired"); return; }
        setTimeout(poll, 2000);
      } catch { setTimeout(poll, 2000); }
    };
    poll();
    return () => { stopped = true; };
  }, [sessionId]);

  return (
    <div className="max-w-md mx-auto py-24 text-center px-6" data-testid="payment-success-page">
      <div className="glass rounded-md p-10">
        {status === "polling" && (
          <>
            <Loader2 className="w-12 h-12 text-teal-400 animate-spin mx-auto" />
            <h1 className="font-display text-2xl font-bold mt-5">Confirming your payment…</h1>
            <p className="text-slate-400 mt-2 text-sm">This usually takes a few seconds.</p>
          </>
        )}
        {status === "paid" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-teal-400 mx-auto" />
            <h1 className="font-display text-3xl font-bold mt-4">Payment successful!</h1>
            <p className="text-slate-400 mt-2">
              {data?.kind === "subscription" ? "Your subscription is active." : "Your asset is in your library."}
            </p>
            <Link to="/dashboard" className="btn-primary inline-flex mt-6">Go to dashboard</Link>
          </>
        )}
        {(status === "expired" || status === "error" || status === "timeout") && (
          <>
            <XCircle className="w-16 h-16 text-amber-400 mx-auto" />
            <h1 className="font-display text-2xl font-bold mt-4">Something went wrong</h1>
            <p className="text-slate-400 mt-2 text-sm">{status === "timeout" ? "Status check timed out. Check your dashboard." : "Payment was not completed."}</p>
            <Link to="/marketplace" className="btn-outline-teal inline-flex mt-6">Back to marketplace</Link>
          </>
        )}
      </div>
    </div>
  );
}
