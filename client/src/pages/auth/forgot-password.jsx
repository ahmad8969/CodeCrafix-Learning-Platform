import { AuthPlaceholder } from '@/pages/auth/_placeholder'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  return (
    <AuthPlaceholder title="Forgot password" description="Password recovery placeholder.">
      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
        <Input type="email" placeholder="Email" disabled />
        <Button className="w-full" disabled>
          Send reset link
        </Button>
      </form>
    </AuthPlaceholder>
  )
}
