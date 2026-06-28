import "@/styles/modal-animations.css";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Seo } from '@/components/seo/Seo';
import { Footer } from '@/components/layout/footer';
import { CheckCircle } from 'lucide-react';

const RentMyCarLanding = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen">
      <Seo
        title={t("seo.rentMyCar.title")}
        description={t("seo.rentMyCar.description")}
        canonical="https://rentanoo.com/rent-my-car"
      />

      {/* Hero ocean-deep */}
      <section className="bg-[#0B1A1F] py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-mono text-sm text-[#0FBFB0]/70 tracking-widest uppercase mb-6">
            Opérateurs · Nosy Be
          </p>
          <h1 className="font-display font-extrabold text-4xl md:text-6xl text-white mb-6">
            Mettez votre flotte<br />
            <span className="text-[#0FBFB0]">en ligne sur Rentanoo</span>
          </h1>
          <p className="font-body text-white/70 text-xl mb-10">
            Rejoignez les opérateurs qui utilisent Rentanoo pour gérer leurs réservations,
            collecter les paiements et gérer leurs états des lieux — tout en ligne.
          </p>
          <a
            href="/rent-my-car/register"
            className="inline-block bg-[#E8622F] text-white font-display font-semibold text-lg px-8 py-4 rounded-xl hover:bg-[#E8622F]/90 transition-colors"
          >
            Devenir opérateur →
          </a>
        </div>
      </section>

      {/* 3 avantages */}
      <section className="py-20 px-4 bg-[#F4F2EE]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '👁', title: 'Visibilité maximale', desc: 'Vos annonces visibles par tous les touristes qui cherchent à Nosy Be.' },
            { icon: '💳', title: 'Paiement sécurisé', desc: 'Stripe gère les paiements. Vous recevez le virement directement.' },
            { icon: '📱', title: 'Gestion simple', desc: "États des lieux numériques, planning, notifications WhatsApp — tout depuis votre téléphone." },
          ].map(a => (
            <div key={a.title} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-4xl mb-4">{a.icon}</div>
              <h3 className="font-display font-bold text-xl text-[#0D1E26] mb-2">{a.title}</h3>
              <p className="font-body text-[#6B8A8D]">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pourquoi Rentanoo */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-[#0D1E26] mb-4">Pourquoi choisir Rentanoo ?</h2>
            <p className="font-body text-[#6B8A8D] text-lg">Rejoignez les opérateurs qui font confiance à notre plateforme</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              "Gagnez de l'argent facilement avec votre flotte",
              "Vous gardez le contrôle total de vos disponibilités",
              "États des lieux numériques pour chaque location",
              "Support client 7j/7 pour vous accompagner"
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#097870] rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <span className="font-body text-lg text-[#0D1E26]">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-[#0B1A1F]">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="font-display font-bold text-2xl text-white mb-4">Prêt à commencer ?</h3>
          <p className="font-body text-white/70 mb-8">
            L'inscription ne prend que quelques minutes. Commencez dès maintenant et mettez votre flotte en location.
          </p>
          <a
            href="/rent-my-car/register"
            className="inline-block bg-[#E8622F] text-white font-display font-semibold text-lg px-8 py-4 rounded-xl hover:bg-[#E8622F]/90 transition-colors"
          >
            Je commence l'inscription →
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RentMyCarLanding;
