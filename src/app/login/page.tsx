import LoginForm from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-12">
      <LoginForm />
    </div>
  );
}
