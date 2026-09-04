import React from "react";
import { Toaster } from "sonner";
import { AppRoutes } from "./routes";

function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <AppRoutes />
    </>
  );
}

export default App;
