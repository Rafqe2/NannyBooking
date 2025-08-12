import CreateAdvertisement from "../../components/CreateAdvertisement";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function CreateAdvertisementPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="flex-1 py-8">
        <CreateAdvertisement />
      </main>
      <Footer />
    </div>
  );
}
