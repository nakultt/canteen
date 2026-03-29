"use client";

export default function LogoutButton() {
  const logout = () => {
    localStorage.removeItem("name");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "/login";
  };

  return (
    <button onClick={logout} className="cursor-pointer hover:underline">
      Logout
    </button>
  );
}
