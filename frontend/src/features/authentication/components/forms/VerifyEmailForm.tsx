import { Button } from "@/shared/components/ui/button";
import AuthErrorMessage from "../auth-ui/AuthErrorMessage";
import CardWrapper from "@/features/authentication/components/auth-ui/CardWrapper";
import { Input } from "@/shared/components/ui/input"; // Import AuthErrorMessage if needed
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { UseFormStatusReturn } from "@/shared/hooks/useFormStatus";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { VerifyEmailSchema } from "@/shared/utils/schema/VerifyEmailSchema";

interface VerifyEmailProps {
  status: string;
  formMessage: string;
  formStatus: UseFormStatusReturn;
  form: UseFormReturn<z.infer<typeof VerifyEmailSchema>>;
  onSubmit: (data: z.infer<typeof VerifyEmailSchema>) => void | Promise<void>;
  cooldown: number;
  isResend?: boolean;
}

const VerifyEmailForm = ({
  status,
  formMessage,
  formStatus,
  form,
  onSubmit,
  cooldown,
  isResend,
}: VerifyEmailProps) => {
  return (
    <>
      <CardWrapper
        label="Verify Email"
        title="Enter your email for registration"
        backLabel="Already have an account?"
        backButtonHref="/login"
        backButtonLabel="Login here"
        logo="none"
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="example@email.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {status == "error" && (
              <AuthErrorMessage formMessage={formMessage} />
            )}
            <Button
              type="submit"
              className="mb-4 w-full"
              disabled={cooldown > 0 || formStatus.pending}
            >
              {cooldown > 0
                ? `Please Wait (${cooldown}s)`
                : status == "loading"
                  ? "Sending..."
                  : isResend
                    ? "Resend Email"
                    : "Send Email"}
            </Button>
            {cooldown > 0 && (
              <p className="text-sm text-muted-foreground">
                You can resend the verification email in {cooldown} seconds.
              </p>
            )}
          </form>
        </Form>
      </CardWrapper>
    </>
  );
};

export default VerifyEmailForm;
