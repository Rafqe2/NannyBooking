import ProfileCompletion from "../../components/ProfileCompletion";
import BlockingLoader from "../../components/BlockingLoader";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useSupabaseUser } from "../../lib/useSupabaseUser";

export default function CompleteProfilePage() {
  const { isLoading } = useSupabaseUser();
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <BlockingLoader message="Loading…" />
        </main>
        <Footer />
      </div>
    );
  }
  return <ProfileCompletion />;
}
