import AppRouter from "../../frontend-new/src/router/AppRouter";
import AuthProvider from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
