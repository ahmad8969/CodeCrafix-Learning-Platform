import { AuthPlaceholder } from '@/pages/auth/_placeholder'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants'

export default function LoginPage() {
  return (
    <AuthPlaceholder title="Sign in" description="Login form placeholder — Prompt 001 foundation.">
      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
        <Input type="email" placeholder="Email" disabled />
        <Input type="password" placeholder="Password" disabled />
        <Button className="w-full" disabled>
          Sign in
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Link to={ROUTES.FORGOT_PASSWORD} className="text-primary hover:underline">
          Forgot password?
        </Link>
        {' · '}
        <Link to={ROUTES.REGISTER} className="text-primary hover:underline">
          Register
        </Link>
      </p>
    </AuthPlaceholder>
  )
}
