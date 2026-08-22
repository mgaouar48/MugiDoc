import { useState, useEffect } from "react";
import { LoginForm } from "@/components/LoginForm";
import { Dashboard } from "@/components/Dashboard";
import { ForcePasswordChangeScreen } from "@/components/ForcePasswordChangeScreen";
import { useAuth, User } from "../hooks/useAuth";

const Index = () => {
  console.log('Index component rendering...');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { getCurrentUser, logout } = useAuth();

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error('Erreur lors de l\'initialisation de l\'authentification:', err);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [getCurrentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
  };

  // Afficher un écran de chargement pendant l'initialisation
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (currentUser.must_change_password) {
    return <ForcePasswordChangeScreen user={currentUser} onChanged={setCurrentUser} />;
  }

  return <Dashboard onLogout={handleLogout} doctorName={`${currentUser.first_name} ${currentUser.last_name}`} user={currentUser} />;
};

export default Index;
