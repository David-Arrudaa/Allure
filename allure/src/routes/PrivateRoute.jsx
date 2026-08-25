import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  // Enquanto o sistema vai no banco verificar se o usuário existe, mostramos isso:
  if (loading) {
    return <div>Carregando o sistema...</div>;
  }

  // Se o carregamento terminou e não tem usuário logado, chuta ele para o /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se passou pelas verificações acima, renderiza a página que ele tentou acessar (children)
  return children;
}
