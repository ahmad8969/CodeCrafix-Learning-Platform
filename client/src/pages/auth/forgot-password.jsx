import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { LoginCard } from '@/components/forms/login-card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { ButtonLoader } from '@/components/loaders'
import { forgotPasswordSchema } from '@/lib/auth-schemas'
import { authService } from '@/services/auth.service'
import { ROUTES } from '@/constants'
import { getErrorMessage, notify } from '@/utils/error'

export default function ForgotPasswordPage() {
  const [devResetUrl, setDevResetUrl] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values) => {
    try {
      const result = await authService.forgotPassword(values)
      notify.success(result.message || 'Check your email for reset instructions')
      if (result.resetUrl) setDevResetUrl(result.resetUrl)
    } catch (error) {
      notify.error(getErrorMessage(error))
    }
  }

  return (
    <LoginCard
      title="Forgot password"
      description="Enter your email and we will send a reset link."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          <Link to={ROUTES.LOGIN} className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <ButtonLoader />}
          Send reset link
        </Button>
      </form>
      {devResetUrl && (
        <Alert variant="info" title="Development reset link">
          <a href={devResetUrl} className="break-all underline">
            {devResetUrl}
          </a>
        </Alert>
      )}
    </LoginCard>
  )
}
