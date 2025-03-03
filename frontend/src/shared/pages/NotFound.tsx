import { useNavigate } from "react-router-dom";
import CardWrapper from "@/features/authentication/components/auth-ui/CardWrapper";
import { Button } from "@/shared/components/ui/button";
import { ModeToggle } from "@/shared/components/theme/ModeToggle";

const NotFound = () => {
  const navigate = useNavigate();

  const handleSubmit = () => {
    // route to dashboard
    navigate("/dashboard");
  };

  return (
    <>
      <div className="flex h-screen flex-col">
        <div className="flex flex-none justify-end pr-2 pt-6">
          <ModeToggle />
        </div>

        {/* Header for the 404 Not Found page */}
        <div className="flex h-full flex-1 items-center justify-center">
          <CardWrapper
            label="This content isn't available right now"
            title="404 Not Found page"
            backLabel=""
            backButtonHref=""
            backButtonLabel=""
            logo="logo"
          >
            <div className="flex justify-center">
              <Button onClick={handleSubmit} className="mb-4">
                Go Back to Dashboard
              </Button>
            </div>
          </CardWrapper>
        </div>
      </div>
    </>
  );
};

export default NotFound;
