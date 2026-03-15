/**
 * (auth)/layout.jsx
 *
 * Layout for the authentication route group: /login, /signup
 *
 * Auth pages are intentionally minimal — no Navbar, no footer.
 * AuthProvider is provided by the root layout via <Providers>,
 * so login and signup can safely call useAuth().
 */
export default function AuthLayout({ children }) {
  return <>{children}</>;
}
