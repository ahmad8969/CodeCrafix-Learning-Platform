import { LoginCard } from '@/components/forms/login-card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants'

/** Registration is out of Prompt 002 API scope — placeholder only. */
export default function RegisterPage() {
  return (
    <LoginCard
      title="Create account"
      description="Self-registration opens in a later prompt. Use seeded demo accounts for now."
    >
      <Button asChild className="w-full">
        <Link to={ROUTES.LOGIN}>Go to sign in</Link>
      </Button>
    </LoginCard>
  )
}
