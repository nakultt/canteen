import Link from "next/link";
import LogoutButton from "./LogoutButon";

export default function Navbar(username : string) {

  return (
    <nav>
      <div>
        <Link href="/">
        CanteenConnect
        </Link>
        <div>
          <Link href="/profile">
            Welcome, {username || "Guest"}
          </Link>
          <Link href="/orders">
            My Orders
          </Link>
          <Link href="/help">
            Help
          </Link>
          <LogoutButton />
        </div>
      </div> 
    </nav>
  )
}