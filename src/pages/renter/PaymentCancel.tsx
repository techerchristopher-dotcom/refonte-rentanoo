import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/footer";

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F4F2EE] flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-[#D8D5CF] p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#E8622F]/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">😕</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-[#0D1E26] mb-3">
            Paiement annulé
          </h1>
          <p className="font-body text-[#6B8A8D] mb-6">
            Tu as annulé le paiement. Ta réservation n'a pas été confirmée.
          </p>
          <div className="space-y-3">
            <Button
              variant="ember"
              className="w-full"
              onClick={() => navigate(-1)}
            >
              Réessayer le paiement
            </Button>
            <Button
              variant="outline"
              className="w-full border-[#D8D5CF] text-[#0D1E26] hover:bg-[#F4F2EE]"
              onClick={() => navigate('/me/renter/bookings')}
            >
              Voir mes réservations
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
