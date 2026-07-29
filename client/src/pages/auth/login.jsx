import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LoginCard } from '@/components/forms/login-card'
import { PasswordInput } from '@/components/forms/password-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ButtonLoader } from '@/components/loaders'
import { loginSchema } from '@/lib/auth-schemas'
import { useAuth } from '@/contexts/auth-context'
import { ROUTES, getHomePathForRole } from '@/constants'
import { getErrorMessage, notify } from '@/utils/error'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'student@codecrafters.dev',
      password: 'Password1',
      rememberMe: true,
    },
  })

  const rememberMe = watch('rememberMe')

  const onSubmit = async (values) => {
    try {
      const data = await login(values)
      notify.success('Welcome back')
      const redirectTo = location.state?.from?.pathname || getHomePathForRole(data.user.role)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      notify.error(getErrorMessage(error, 'Login failed'))
    }
  }

  return (
    <LoginCard title="Sign in" description="Access your CodeCrafters learning portal.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" autoComplete="current-password" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={Boolean(rememberMe)}
              onCheckedChange={(v) => setValue('rememberMe', Boolean(v))}
            />
            Remember me
          </label>
          <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <ButtonLoader />}
          Sign in
        </Button>
      </form>
      <p className="text-center text-xs text-muted-foreground">
        Demo: student@ / teacher@ / admin@ / superadmin@codecrafters.dev · Password1
      </p>
    </LoginCard>
  )
}
