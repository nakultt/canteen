"use client"

export default function LogoutButton () {
  const logout = () => {
    localStorage.removeItem("name")
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  return (
    <button onClick={logout}>
      Logout
    </button>
  )
}