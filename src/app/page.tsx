import Navbar from "@/components/Navbar";
import MenuDisplay from "@/components/MenuDisplay";
import Cart from "@/components/Cart";

export default function Home() {
  // TODO: Get userId from session/auth
  const userId = 1; // Hardcoded for now

  return (
    <div>
      <Navbar username="Nakul" />
      <div className="flex items-center justify-center bg-green-200 h-12 text-2xl">
        LUNCH orders closes on 11:30 PM
      </div>
      <MenuDisplay userId={userId} />
      <Cart userId={userId} />
    </div>
  );
}
