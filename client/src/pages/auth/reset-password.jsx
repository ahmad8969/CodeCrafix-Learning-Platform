import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LoginCard } from '@/components/forms/login-card'
import { PasswordInput } from '@/components/forms/password-input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ButtonLoader } from '@/components/loaders'
import { resetPasswordSchema } from '@/lib/auth-schemas'
import { authService } from '@/services/auth.service'
import { ROUTES } from '@/constants'
import { getErrorMessage, notify } from '@/utils/error'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = async (values) => {
    if (!token) {
      notify.error('Missing reset token')
      return
    }
    try {
      const result = await authService.resetPassword({
        token,
        password: values.password,
        confirmPassword: values.confirmPassword,
      })
      notify.success(result.message || 'Password updated')
      navigate(ROUTES.LOGIN)
    } catch (error) {
      notify.error(getErrorMessage(error))
    }
  }

  return (
    <LoginCard
      title="Reset password"
      description="Choose a strong new password for your account."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          <Link to={ROUTES.LOGIN} className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      {!token && (
        <p className="text-sm text-destructive">
          Reset token missing. Request a new link from forgot password.
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput id="password" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput id="confirmPassword" {...register('confirmPassword')} />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting || !token}>
          {isSubmitting && <ButtonLoader />}
          Update password
        </Button>
      </form>
    </LoginCard>
  )
}
