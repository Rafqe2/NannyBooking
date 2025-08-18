"use client";

import { use as useUnwrap } from "react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import EditAdvertisement from "../../../components/EditAdvertisement";

export default function EditAdvertisementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = useUnwrap(params);
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="flex-1 py-8">
        <EditAdvertisement advertisementId={id} />
      </main>
      <Footer />
    </div>
  );
}
