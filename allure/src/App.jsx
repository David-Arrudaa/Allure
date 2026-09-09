import React from "react";
import { AppRoutes } from "./routes";
import { Toaster } from "./components/ui/Toaster";

function App() {
  // A responsabilidade de mostrar conteúdo saiu daqui e foi para o AppRoutes!
  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  );
}

export default App;
