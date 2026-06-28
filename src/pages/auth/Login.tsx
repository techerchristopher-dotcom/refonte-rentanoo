import "@/styles/modal-animations.css";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GoogleIcon } from "@/components/ui/social-icons";
import { AUTH_CALLBACK_URL } from "@/lib/config";
import {
  buildAuthCallbackUrl,
  buildAuthLink,
  resolvePostAuthRedirect,
} from "@/lib/safeRedirectPath";

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Adresse email invalide"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const demoAccounts = [
  { email: "renter@demo.fr", password: "demo", role: "Locataire" },
  { email: "owner@demo.fr", password: "demo", role: "Propriétaire" },
  { email: "admin@demo.fr", password: "demo", role: "Administrateur" },
];

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        const friendlyMessage =
          error.message?.toLowerCase().includes("invalid login") ||
          error.message?.toLowerCase().includes("invalid_credentials")
            ? "Identifiants invalides. Vérifiez votre email, votre mot de passe, ou réinitialise ton mot de passe."
            : error.message;
        toast({
          title: "Erreur de connexion",
          description: friendlyMessage,
          variant: "destructive",
        });
        setShowForgotPassword(true);
        forgotPasswordForm.setValue("email", data.email);
        return;
      }

      if (authData.user) {
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur Rentanoo !",
        });
        navigate(resolvePostAuthRedirect(searchParams.get("redirect")));
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (email: string, password: string) => {
    form.setValue("email", email);
    form.setValue("password", password);
    form.handleSubmit(onSubmit)();
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email envoyé !",
        description: `Un lien de réinitialisation a été envoyé à ${data.email}. Vérifie ta boîte de réception.`,
      });
      setShowForgotPassword(false);
      forgotPasswordForm.reset();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F2EE] flex">
      {/* Panneau gauche : brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B1A1F] items-center justify-center p-12 relative overflow-hidden">
        {/* Décoration subtile */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#097870] blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-[#E8622F] blur-3xl" />
        </div>
        <div className="text-center relative z-10">
          <span className="font-display font-bold text-5xl text-white block mb-6">Rentanoo</span>
          <p className="font-body text-white/60 text-lg leading-relaxed">
            Nosy Be comme tu l'imagines.<br />Sans les galères.
          </p>
          <div className="mt-12 flex flex-col gap-3 text-left">
            {[
              "Location de voitures à Nosy Be",
              "Propriétaires vérifiés",
              "Paiement 100% sécurisé",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-white/50 text-sm font-body">
                <span className="w-1.5 h-1.5 rounded-full bg-[#097870] flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panneau droit : formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Logo mobile uniquement */}
          <div className="lg:hidden text-center mb-8">
            <span className="font-display font-bold text-3xl text-[#0D1E26]">Rentanoo</span>
          </div>

          <h1 className="font-display font-bold text-3xl text-[#0D1E26] mb-2">
            Connecte-toi
          </h1>
          <p className="font-body text-[#6B8A8D] mb-8">
            Pas encore de compte ?{" "}
            <Link
              to={buildAuthLink("/auth/register", searchParams.get("redirect"))}
              className="text-[#097870] hover:underline font-medium"
            >
              Créer un compte
            </Link>
          </p>

          {/* Cart context banner */}
          {searchParams.get("redirect")?.includes("/panier") && (
            <div className="mb-6 rounded-xl bg-[#097870]/10 border border-[#097870]/20 px-4 py-3 text-sm text-[#097870] font-medium text-center font-body">
              Connecte-toi pour envoyer ta demande de réservation — ton panier est sauvegardé.
            </div>
          )}

          {/* Google OAuth */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border border-[#D8D5CF] rounded-xl hover:bg-[#F4F2EE] font-body"
              onClick={async () => {
                setLoading(true);
                try {
                  await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                      redirectTo: buildAuthCallbackUrl(
                        AUTH_CALLBACK_URL,
                        searchParams.get("redirect")
                      ),
                    },
                  });
                } catch (error) {
                  toast({
                    title: "Erreur",
                    description: "Erreur lors de la connexion avec Google",
                    variant: "destructive",
                  });
                  setLoading(false);
                }
              }}
              disabled={loading}
              data-testid="btn-google-login-header"
              aria-label="Continuer avec Google (connexion)"
            >
              <GoogleIcon className="h-5 w-5 mr-3" />
              {loading ? "Redirection..." : "Continuer avec Google"}
            </Button>
          </div>

          {/* Séparateur */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#D8D5CF]" />
            </div>
            <div className="relative flex justify-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowEmailForm(!showEmailForm)}
                className="bg-[#F4F2EE] px-4 text-sm text-[#6B8A8D] hover:text-[#0D1E26] transition-colors font-body"
              >
                OU PAR EMAIL
                {showEmailForm ? (
                  <ChevronUp className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-2 h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Formulaire email — animé */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showEmailForm ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            {showEmailForm && (
              <div className="space-y-4">
                {!showForgotPassword ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-body text-[#0D1E26]">Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="toi@exemple.com"
                                className="border border-[#D8D5CF] rounded-xl focus:ring-[#097870] focus:border-[#097870] font-body"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-body text-[#0D1E26]">Mot de passe</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  className="border border-[#D8D5CF] rounded-xl focus:ring-[#097870] focus:border-[#097870] font-body"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-[#6B8A8D]" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-[#6B8A8D]" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Mot de passe oublié */}
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto font-normal text-sm text-[#097870] hover:underline font-body"
                          onClick={() => {
                            setShowForgotPassword(true);
                            if (form.getValues("email")) {
                              forgotPasswordForm.setValue("email", form.getValues("email"));
                            }
                          }}
                        >
                          Mot de passe oublié ?
                        </Button>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 bg-[#E8622F] hover:bg-[#E8622F]/90 text-white rounded-xl font-body font-medium"
                        disabled={loading}
                      >
                        {loading ? "Connexion..." : "Se connecter"}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  /* Formulaire mot de passe oublié */
                  <div className="animate-fade-in">
                    <Form {...forgotPasswordForm}>
                      <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                        <div className="text-center border-b border-[#D8D5CF] pb-4 mb-4">
                          <h3 className="font-display text-lg font-semibold text-[#097870]">Réinitialiser le mot de passe</h3>
                          <p className="font-body text-sm text-[#6B8A8D] mt-2">
                            Saisis ton adresse email et nous t'enverrons un lien de réinitialisation
                          </p>
                        </div>

                        <FormField
                          control={forgotPasswordForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-body text-[#0D1E26]">Adresse email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="toi@exemple.com"
                                  className="h-12 border border-[#D8D5CF] rounded-xl focus:ring-[#097870] focus:border-[#097870] font-body"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex space-x-3 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1 h-12 border border-[#D8D5CF] rounded-xl font-body"
                            onClick={() => {
                              setShowForgotPassword(false);
                              forgotPasswordForm.reset();
                            }}
                          >
                            Annuler
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1 h-12 bg-[#E8622F] hover:bg-[#E8622F]/90 text-white rounded-xl font-body font-medium"
                            disabled={!forgotPasswordForm.formState.isValid}
                          >
                            Envoyer le lien
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Retour accueil */}
          <div className="text-center mt-8">
            <Link
              to="/"
              className="text-sm text-[#6B8A8D] hover:text-[#097870] transition-colors font-body"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
