import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileService } from "@/services/supabase/profile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadBookingResumeIntent } from "@/lib/bookingResumeIntent";
import { buildAuthLink } from "@/lib/safeRedirectPath";

const STEPS = [
  { id: 1, label: "Session active" },
  { id: 2, label: "Confirmer le compte" },
  { id: 3, label: "Profil complété" },
  { id: 4, label: "Terminé" },
] as const;

export default function ClientOnboarding() {
  const { session, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    kycStatus: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [completionFirst, setCompletionFirst] = useState("");
  const [completionLast, setCompletionLast] = useState("");
  const [completionPhone, setCompletionPhone] = useState("");
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const hasSession = Boolean(session?.user);
  const isKycVerified = profile?.kycStatus === "verified";
  const isProfileComplete = Boolean(
    profile?.firstName?.trim() && profile?.lastName?.trim() && profile?.phone?.trim()
  );

  let currentStep: 1 | 2 | 3 | 4 = 1;
  if (!hasSession) currentStep = 1;
  else if (profileLoading || !isKycVerified) currentStep = 2;
  else if (!isProfileComplete) currentStep = 3;
  else currentStep = 4;

  // Charger le profil (pour vérifier kyc_status et complétude)
  useEffect(() => {
    if (!hasSession) {
      setProfileLoading(false);
      setProfile(null);
      setProfileError(null);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    setProfileError(null);
    ProfileService.getCurrentUserProfile()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setProfileError(error);
          setProfile(null);
        } else if (data) {
          setProfile({
            id: data.id,
            email: data.email ?? "",
            firstName: data.firstName ?? "",
            lastName: data.lastName ?? "",
            phone: data.phone ?? "",
            kycStatus: data.kycStatus ?? "pending",
          });
        } else {
          setProfile(null);
        }
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => { cancelled = true; };
  }, [hasSession]);

  // Préremplir le formulaire de complétion (ex. noms issus de Google après backfill)
  useEffect(() => {
    if (!profile) return;
    setCompletionFirst((prev) => (prev === "" ? profile.firstName || "" : prev));
    setCompletionLast((prev) => (prev === "" ? profile.lastName || "" : prev));
    setCompletionPhone((prev) => (prev === "" ? profile.phone || "" : prev));
  }, [profile?.id, profile?.firstName, profile?.lastName, profile?.phone]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setProfileError(null);
    await refreshUser();
    // Refresh profile (inclut kyc_status)
    const { data, error } = await ProfileService.getCurrentUserProfile();
    setProfileError(error ?? null);
    if (data) {
      setProfile({
        id: data.id,
        email: data.email ?? "",
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        phone: data.phone ?? "",
        kycStatus: data.kycStatus ?? "pending",
      });
    }
    setRefreshing(false);
  };

  const handleConfirmAccount = async () => {
    setChecking(true);
    setCheckError(null);
    setShowResend(false);

    // Refetch le profil pour vérifier kyc_status
    const { data, error } = await ProfileService.getCurrentUserProfile();

    if (error || !data) {
      setCheckError("Impossible de vérifier ton statut.");
      setShowResend(true);
      setChecking(false);
      return;
    }

    setProfile({
      id: data.id,
      email: data.email ?? "",
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      phone: data.phone ?? "",
      kycStatus: data.kycStatus ?? "pending",
    });

    if (data.kycStatus !== "verified") {
      setCheckError("Ton compte n'est pas encore confirmé. Vérifie ton email.");
      setShowResend(true);
    } else {
      setCheckError(null);
      setShowResend(false);
    }

    setChecking(false);
  };

  const handleCompleteProfile = async () => {
    setCompletionError(null);
    const first = completionFirst.trim();
    const last = completionLast.trim();
    const phone = completionPhone.trim();
    if (!first || !last || !phone) {
      setCompletionError("Le prénom, le nom et le numéro de téléphone sont obligatoires pour continuer.");
      return;
    }
    setSavingProfile(true);
    try {
      const { data, error } = await ProfileService.updateProfile({
        firstName: first,
        lastName: last,
        phone,
      });
      if (error || !data) {
        setCompletionError(error || "Enregistrement impossible. Réessaye.");
        return;
      }
      await refreshUser();
      const { data: fresh, error: freshErr } = await ProfileService.getCurrentUserProfile();
      if (freshErr || !fresh) {
        setProfileError(freshErr ?? "Profil introuvable après enregistrement.");
        return;
      }
      setProfile({
        id: fresh.id,
        email: fresh.email ?? "",
        firstName: fresh.firstName ?? "",
        lastName: fresh.lastName ?? "",
        phone: fresh.phone ?? "",
        kycStatus: fresh.kycStatus ?? "pending",
      });
      toast({
        title: "Profil enregistré",
        description: "Tu peux poursuivre ton inscription.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResendEmail = async () => {
    const userEmail = session?.user?.email;
    const userId = session?.user?.id;
    if (!userEmail || !userId) {
      toast({
        title: "Erreur",
        description: "Adresse email introuvable.",
        variant: "destructive",
      });
      return;
    }

    const webhookUrl = import.meta.env.VITE_N8N_PROFILES_CREATED_WEBHOOK_URL;
    if (!webhookUrl) {
      toast({
        title: "Erreur",
        description: "Configuration email manquante (webhook).",
        variant: "destructive",
      });
      return;
    }

    setResending(true);
    try {
      // Appel webhook n8n profiles-created (même workflow que l'inscription)
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: {
            record: {
              id: userId,
              email: userEmail,
              first_name: profile?.firstName || null,
              last_name: profile?.lastName || null,
              phone: profile?.phone || null,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Erreur réseau");
        console.error("[RESEND N8N] failed", { status: response.status, error: errorText });
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      console.log("[RESEND N8N] ok");
      toast({
        title: "Email renvoyé",
        description: "Vérifie ta boîte mail.",
      });
    } catch (error) {
      console.error("[RESEND N8N] failed", error);
      toast({
        title: "Erreur",
        description: "Impossible de renvoyer l'email. Réessaye.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const getStepStatus = (stepId: number): "done" | "current" | "locked" => {
    if (stepId < currentStep) return "done";
    if (stepId === currentStep) return "current";
    return "locked";
  };

  const resumeIntent = loadBookingResumeIntent();

  return (
    <div className="min-h-screen bg-[#F4F2EE] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg rounded-2xl border-0">
        <CardContent className="p-8 space-y-8">
          {/* En-tête */}
          <div className="text-center">
            <span className="font-display font-bold text-2xl text-[#0D1E26] block mb-1">Rentanoo</span>
            <h1 className="font-display font-bold text-xl text-[#0D1E26]">Bienvenue !</h1>
            <p className="font-body text-[#6B8A8D] text-sm mt-1">Complète ton inscription en quelques étapes</p>
          </div>

          {/* Stepper numéroté avec ligne de connexion */}
          <div className="relative">
            {/* Ligne de connexion */}
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-[#D8D5CF]" style={{ left: 'calc(20px + 1.25rem)', right: 'calc(20px + 1.25rem)' }} />
            <div
              className="absolute top-5 h-0.5 bg-[#E8622F] transition-all duration-500"
              style={{
                left: 'calc(20px + 1.25rem)',
                width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
                maxWidth: 'calc(100% - 40px - 2.5rem)',
              }}
            />

            <div className="flex justify-between relative z-10">
              {STEPS.map((step) => {
                const status = getStepStatus(step.id);
                return (
                  <div key={step.id} className="flex flex-col items-center gap-2">
                    {/* Cercle numéroté */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm transition-all duration-300 ${
                        status === "done"
                          ? "bg-[#E8622F] text-white shadow-md"
                          : status === "current"
                          ? "bg-[#E8622F] text-white shadow-lg ring-4 ring-[#E8622F]/20"
                          : "bg-white border-2 border-[#D8D5CF] text-[#6B8A8D]"
                      }`}
                    >
                      {status === "done" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        step.id
                      )}
                    </div>
                    {/* Label */}
                    <span
                      className={`font-body text-xs text-center max-w-[64px] leading-tight ${
                        status === "locked"
                          ? "text-[#6B8A8D]/50"
                          : status === "done"
                          ? "text-[#E8622F]"
                          : "text-[#0D1E26] font-medium"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions selon l'étape */}
          <div className="space-y-4">
            {authLoading || (hasSession && profileLoading) ? (
              <div className="flex items-center justify-center gap-2 py-6">
                <Loader2 className="h-5 w-5 animate-spin text-[#097870]" />
                <span className="font-body text-sm text-[#6B8A8D]">Chargement...</span>
              </div>
            ) : currentStep === 1 ? (
              <>
                <p className="font-body text-sm text-[#6B8A8D]">
                  Connecte-toi pour continuer ton onboarding.
                </p>
                <Button
                  onClick={() =>
                    navigate(
                      buildAuthLink("/auth/login", resumeIntent?.path ?? null)
                    )
                  }
                  className="w-full h-11 bg-[#E8622F] hover:bg-[#E8622F]/90 text-white rounded-xl font-body font-medium"
                >
                  Se connecter
                </Button>
              </>
            ) : currentStep === 2 ? (
              <>
                <div className="bg-[#097870]/5 border border-[#097870]/20 rounded-xl px-4 py-3">
                  <p className="font-body text-sm text-[#0D1E26]">
                    Confirme ton compte via l'email reçu, puis reviens ici.
                  </p>
                </div>
                {checkError && (
                  <p className="font-body text-sm text-red-600">{checkError}</p>
                )}
                <Button
                  onClick={handleConfirmAccount}
                  disabled={checking}
                  className="w-full h-11 bg-[#E8622F] hover:bg-[#E8622F]/90 text-white rounded-xl font-body font-medium"
                >
                  {checking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    "J'ai confirmé mon compte"
                  )}
                </Button>
                {showResend && (
                  <Button
                    onClick={handleResendEmail}
                    disabled={resending || !session?.user?.email}
                    variant="outline"
                    className="w-full h-11 border border-[#D8D5CF] rounded-xl font-body"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      "Renvoyer l'email"
                    )}
                  </Button>
                )}
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing || checking}
                  variant="ghost"
                  size="sm"
                  className="w-full font-body text-[#6B8A8D] hover:text-[#097870]"
                >
                  {refreshing ? "Rafraîchissement..." : "Rafraîchir"}
                </Button>
              </>
            ) : currentStep === 3 ? (
              <>
                <div className="bg-[#097870]/5 border border-[#097870]/20 rounded-xl px-4 py-3">
                  <p className="font-body text-sm text-[#0D1E26]">
                    Pour utiliser la plateforme, nous avons besoin de ton prénom, nom et téléphone. La connexion Google ne fournit pas toujours ces informations.
                  </p>
                </div>
                {profileError && (
                  <p className="font-body text-sm text-red-600">Impossible de charger le profil.</p>
                )}
                {completionError && (
                  <p className="font-body text-sm text-red-600">{completionError}</p>
                )}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="onboarding-first" className="font-body text-[#0D1E26] text-sm">Prénom</Label>
                    <Input
                      id="onboarding-first"
                      autoComplete="given-name"
                      value={completionFirst}
                      onChange={(e) => setCompletionFirst(e.target.value)}
                      disabled={savingProfile || profileLoading}
                      className="border border-[#D8D5CF] rounded-xl focus:ring-[#097870] focus:border-[#097870] font-body"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="onboarding-last" className="font-body text-[#0D1E26] text-sm">Nom</Label>
                    <Input
                      id="onboarding-last"
                      autoComplete="family-name"
                      value={completionLast}
                      onChange={(e) => setCompletionLast(e.target.value)}
                      disabled={savingProfile || profileLoading}
                      className="border border-[#D8D5CF] rounded-xl focus:ring-[#097870] focus:border-[#097870] font-body"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="onboarding-phone" className="font-body text-[#0D1E26] text-sm">Téléphone</Label>
                    <Input
                      id="onboarding-phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="Ex. +261 32 …"
                      value={completionPhone}
                      onChange={(e) => setCompletionPhone(e.target.value)}
                      disabled={savingProfile || profileLoading}
                      className="border border-[#D8D5CF] rounded-xl focus:ring-[#097870] focus:border-[#097870] font-body"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCompleteProfile}
                  disabled={savingProfile || profileLoading}
                  className="w-full h-11 bg-[#E8622F] hover:bg-[#E8622F]/90 text-white rounded-xl font-body font-medium"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer et continuer"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 border border-[#D8D5CF] rounded-xl font-body"
                  onClick={() => navigate("/profile")}
                  disabled={savingProfile}
                >
                  Plus de détails sur ma page profil
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full font-body text-[#6B8A8D] hover:text-[#097870]"
                  onClick={handleRefresh}
                  disabled={refreshing || savingProfile}
                >
                  {refreshing ? "Rafraîchissement..." : "Rafraîchir les données"}
                </Button>
              </>
            ) : (
              <>
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-[#E8622F]/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-[#E8622F]" />
                  </div>
                  <p className="font-display font-bold text-lg text-[#0D1E26] mb-1">Inscription terminée !</p>
                  <p className="font-body text-sm text-[#6B8A8D]">Ton profil est prêt. Bonne location !</p>
                </div>
                <Button
                  onClick={() => navigate(resumeIntent?.path ?? "/")}
                  className="w-full h-11 bg-[#E8622F] hover:bg-[#E8622F]/90 text-white rounded-xl font-body font-medium"
                >
                  {resumeIntent
                    ? "Reprendre ma réservation"
                    : "Accéder à l’accueil"}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
