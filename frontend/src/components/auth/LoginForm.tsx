import React from "react";
import CardWrapper from "./CardWrapper";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoginSchema } from "@/utils/schema/LoginSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";

const LoginForm = () => {
  const form = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: z.infer<typeof LoginSchema>) => {
    console.log(data);
  };

  return (
    <>
      <CardWrapper
        label="Welcome to Fitness AI"
        title="Login"
        backLabel="Don't have an account?"
        backButtonHref="/register"
        backButtonLabel="Register"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="******" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormDescription className="flex items-center justify-end w-full">
                <p className="text-muted-foreground text-xs">
                  Don't remember your password?
                </p>
                <Button
                  variant="link"
                  className="font-normal text-xs px-1"
                  size="sm"
                  asChild
                >
                  <Link to="/forgot-password">Forgot Password</Link>
                </Button>
              </FormDescription>
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </Form>
      </CardWrapper>
    </>
  );
};

export default LoginForm;
