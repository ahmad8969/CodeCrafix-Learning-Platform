import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { LoginCard } from '@/components/forms/login-card'
import { PasswordInput } from '@/components/forms/password-input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ButtonLoader } from '@/components/loaders'
import { changePasswordSchema } from '@/lib/auth-schemas'
import { authService } from '@/services/auth.service'
import { useAuth } from '@/contexts/auth-context'
import { ROUTES } from '@/constants'
import { getErrorMessage, notify } from '@/utils/error'

export default function ChangePasswordPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values) => {
    try {
      const result = await authService.changePassword(values)
      notify.success(result.message || 'Password changed')
      await logout()
      navigate(ROUTES.LOGIN)
    } catch (error) {
      notify.error(getErrorMessage(error))
    }
  }

  return (
    <LoginCard title="Change password" description="Update your account password.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <PasswordInput id="currentPassword" {...register('currentPassword')} />
          {errors.currentPassword && (
            <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <PasswordInput id="newPassword" {...register('newPassword')} />
          {errors.newPassword && (
            <p className="text-xs text-destructive">{errors.newPassword.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <PasswordInput id="confirmPassword" {...register('confirmPassword')} />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <ButtonLoader />}
          Save password
        </Button>
      </form>
    </LoginCard>
  )
}
