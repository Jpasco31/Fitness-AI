import React from "react";
import { Outlet } from "react-router-dom";
import Logo from "@/components/ui/logo";

const AuthLayout = () => {
  // Example: You can determine the theme dynamically or set it statically
  const currentTheme: "light" | "dark" = "light"; // Replace with dynamic theme detection if available

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header for the authentication layout */}
      <header className="flex items-center justify-center p-6">
        <Logo
          className="w-32" // Adjust width as needed
          alt="Company Logo"
          theme={currentTheme}
          variant="withText" // Change to "withoutText" as needed
        />
      </header>

      {/* Main content area */}
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
