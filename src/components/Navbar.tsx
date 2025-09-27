import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function Navbar({username} : {username?:string}) {

  return (
    <nav>
      <div className="flex flex-row p-3 bg-emerald-800 justify-between text-white h-12">
        <Link href="/">
        CanteenConnect
        </Link>
        <div className="flex gap-x-5">
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