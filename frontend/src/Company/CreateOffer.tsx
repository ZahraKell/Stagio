// src/pages/company/CreateOffer.tsx
import { useNavigate } from "react-router-dom";
import CompanyLayout from "../components/CompanyLayout";
import OfferForm from "../components/OfferForm";

export default function CreateOffer() {
  const navigate = useNavigate();
  return (
    <CompanyLayout>
      <OfferForm
        mode="create"
        onSuccess={() => navigate("/company/offers")}
        onCancel={() => navigate("/company/offers")}
      />
    </CompanyLayout>
  );
}
