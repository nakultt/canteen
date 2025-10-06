import Navbar from "@/components/Navbar";
import MenuDisplay from "@/components/MenuDisplay";
import Cart from "@/components/Cart";

export default function Home() {
  // TODO: Get userId from session/auth
  const userId = 1; // Hardcoded for now

  return (
    <div>
      <Navbar username="Nakul" />
      <MenuDisplay userId={userId} />
      <Cart userId={userId} />
    </div>
  );
}
