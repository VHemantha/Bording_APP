import logo from '../assets/logo.png'

export const APP_NAME = 'Place'

/** The Place wordmark (orange on transparent, ~2.3:1). Size it with a height class. */
export default function Logo({ className = 'h-10' }) {
  return <img src={logo} alt={APP_NAME} className={`w-auto ${className}`} width="560" height="240" />
}
