import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, ChevronDown, ChevronUp, CheckCircle2, Mail } from "lucide-react";
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

const registerSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  phone: z
    .string()
    .trim()
    .min(6, "Le numéro de téléphone est requis"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailConfirmationPending, setEmailConfirmationPending] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const redirectParam = searchParams.get("redirect");

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      const emailRedirectTo = buildAuthCallbackUrl(
        AUTH_CALLBACK_URL,
        redirectParam
      );
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo,
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone.trim(),
          },
        },
      });

      if (error) {
        toast({
          title: "Erreur d'inscription",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (authData.user) {
        if (authData.session) {
          toast({
            title: "Compte créé",
            description: "Bienvenue !",
          });
          navigate(resolvePostAuthRedirect(redirectParam));
        } else {
          setEmailConfirmationPending(true);
          setShowEmailForm(false);
        }
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

  return (
    <div className="min-h-screen bg-[#F4F2EE] flex">
      {/* Panneau gauche : brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B1A1F] items-center justify-center p-12 relative overflow-hidden">
        {/* Décoration */}
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
              "Inscription gratuite en 2 minutes",
              "Réservation immédiate",
              "Support disponible 7j/7",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-white/50 text-sm font-body">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8622F] flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panneau droit : formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-sm py-8">
          {/* Logo mobile uniquement */}
          <div className="lg:hidden text-center mb-8">
            <span className="font-display font-bold text-3xl text-[#0D1E26]">Rentanoo</span>
          </div>

          {emailConfirmationPending ? (
            /* État post-inscription : confirmation email */
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-[#097870]/10 border-2 border-[#097870]/20 flex items-center justify-center">
                  <Mail className="h-10 w-10 text-[#097870]" />
                </div>
              </div>
              <h1 className="font-display font-bold text-2xl text-[#0D1E26] mb-3">
                Compte créé !
              </h1>
              <p className="font-body text-[#6B8A8D] mb-2">
                Vérifie ta boîte mail — clique sur le lien pour activer ton compte.
              </p>
              <p className="font-body text-sm text-[#6B8A8D] mb-2">
                Ta réservation est enregistrée et t'attend.
              </p>
              <p className="font-body text-sm text-[#6B8A8D] mb-8">
                Après validation de ton email, tu reviendras automatiquement sur ton véhicule.
              </p>
              <Button
                type="button"
                onClick={() => navigate(buildAuthLink("/auth/login", redirectParam))}
                className="w-full h-11 bg-[#E8622F] hover:bg-[#E8622F]/90 text-white rounded-xl font-body font-medium"
              >
                J&apos;ai confirmé mon email
              </Button>
              <p className="font-body text-xs text-[#6B8A8D] text-center mt-4">
                Vérifie aussi tes spams si tu ne trouves pas l'email.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-display font-bold text-3xl text-[#0D1E26] mb-2">
                Crée ton compte
              </h1>
              <p className="font-body text-[#6B8A8D] mb-8">
                Déjà membre ?{" "}
                <Link
                  to={buildAuthLink("/auth/login", redirectParam)}
                  className="text-[#097870] hover:underline font-medium"
                >
                  Se connecter
                </Link>
              </p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Cart context banner */}
                  {redirectParam?.includes("/panier") && (
                    <div className="rounded-xl bg-[#097870]/10 border border-[#097870]/20 px-4 py-3 text-sm text-[#097870] font-medium text-center font-body">
                      Crée ton compte pour envoyer ta demande de réservation — ton panier est sauvegardé.
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
                                redirectParam
                              ),
                            },
                          });
                        } catch (error) {
                          toast({
                            title: "Erreur",
                            description: "Erreur lors de l'inscription avec Google",
                            variant: "destructive",
                          });
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      data-testid="btn-google-register-header"
                      aria-label="Continuer avec Google (inscription)"
                    >
                      <GoogleIcon className="h-5 w-5 mr-3" />
                      {loading ? "Redirection..." : "Continuer avec Google"}
                    </Button>
                  </div>

                  {/* Séparateur */}
                  <div className="relative my-2">
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
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      showEmailForm
                        ? "max-h-[800px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    {showEmailForm && (
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-body text-[#0D1E26]">Prénom</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Jean"
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
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-body text-[#0D1E26]">Nom</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Dupont"
                                    className="border border-[#D8D5CF] rounded-xl focus:ring-[#097870] focus:border-[#097870] font-body"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

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
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-body text-[#0D1E26]">Téléphone</FormLabel>
                              <FormControl>
                                <Input
                                  type="tel"
                                  placeholder="+262 692 12 34 56"
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

                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-body text-[#0D1E26]">Confirmer le mot de passe</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="border border-[#D8D5CF] rounded-xl focus:ring-[#097870] focus:border-[#097870] font-body"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  >
                                    {showConfirmPassword ? (
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

                        <Button
                          type="submit"
                          className="w-full h-11 bg-[#E8622F] hover:bg-[#E8622F]/90 text-white rounded-xl font-body font-medium"
                          disabled={loading}
                        >
                          {loading ? "Création du compte..." : "Créer mon compte"}
                        </Button>
                      </div>
                    )}
                  </div>
                </form>
              </Form>
            </>
          )}

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
