import logo from '../assets/logo.png'
import logoLight from '../assets/logo-light.png'

export const APP_NAME = 'Place'

/**
 * The "place එක!" logo (orange wordmark, Sinhala line underneath; transparent PNG, ~1.9:1).
 * Size it with a height class. `onDark` swaps the black Sinhala line for white, for dark
 * backgrounds such as the admin sidebar.
 */
export default function Logo({ className = 'h-10', onDark = false }) {
  return (
    <img src={onDark ? logoLight : logo} alt={APP_NAME} className={`w-auto ${className}`} width="574" height="300" />
  )
}
