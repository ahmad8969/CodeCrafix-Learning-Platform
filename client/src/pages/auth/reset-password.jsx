import { AuthPlaceholder } from '@/pages/auth/_placeholder'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ResetPasswordPage() {
  return (
    <AuthPlaceholder title="Reset password" description="Reset password placeholder.">
      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
        <Input type="password" placeholder="New password" disabled />
        <Input type="password" placeholder="Confirm password" disabled />
        <Button className="w-full" disabled>
          Update password
        </Button>
      </form>
    </AuthPlaceholder>
  )
}
