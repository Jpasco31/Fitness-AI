import { ChangePasswordForm } from "@/features/profile/components/changePassword/ChangePasswordForm";
import useStatus from "@/shared/hooks/useStatus";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import useFormStatus from "@/shared/hooks/useFormStatus";
import { useUser } from "@/shared/hooks/context/UserContext";
import useTimer from "@/shared/hooks/useTimer";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ChangePasswordSchema } from "@/shared/utils/schema/ChangePasswordSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChangePasswordRequest } from "@/shared/services/User/ChangePassword";
import { toast } from "@/shared/hooks/use-toast";

export const ChangePassword = () => {
  const { status, setLoading, setDone, setError } = useStatus();
  const navigate = useNavigate();
  const [formMessage, setFormMessage] = useState<string>("");
  const formStatus = useFormStatus();
  const { token, refreshToken } = useUser();

  // Initialize the timer with a 60-second cooldown
  const {
    timeLeft: cooldown,
    start: startCooldown,
    reset: resetCooldown,
  } = useTimer(
    0,
    () => {
      setFormMessage("");
      setDone();
    },
    "changePasswordCooldown",
  );

  const form = useForm<z.infer<typeof ChangePasswordSchema>>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof ChangePasswordSchema>) => {
    refreshToken();
    try {
      setLoading();
      const response = await ChangePasswordRequest({ token, data });
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Optional delay

      if (!response?.success) {
        setError();
        setFormMessage(response?.message || "Change password failed");
        startCooldown(response?.retry_after || 0);
        return;
      }

      if (response?.success) {
        setDone();
        setFormMessage("");
        toast({
          title: response?.message || "Change password successful",
          description: "Your password has been updated",
        });
        resetCooldown();
        navigate("/profile");
        return;
      }
    } catch (error) {
      setError();
      setFormMessage("An unexpected error occurred");
    }
  };

  return (
    <>
      <ChangePasswordForm
        form={form}
        status={status}
        formMessage={formMessage}
        formStatus={formStatus}
        onSubmit={onSubmit}
        cooldown={cooldown}
      />
    </>
  );
};
