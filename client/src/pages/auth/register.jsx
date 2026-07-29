import { AuthPlaceholder } from '@/pages/auth/_placeholder'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants'

export default function RegisterPage() {
  return (
    <AuthPlaceholder title="Create account" description="Registration placeholder — Prompt 001 foundation.">
      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
        <Input placeholder="Full name" disabled />
        <Input type="email" placeholder="Email" disabled />
        <Input type="password" placeholder="Password" disabled />
        <Button className="w-full" disabled>
          Create account
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Link to={ROUTES.LOGIN} className="text-primary hover:underline">
          Already have an account?
        </Link>
      </p>
    </AuthPlaceholder>
  )
}
