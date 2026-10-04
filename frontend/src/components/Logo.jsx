import logo from '../assets/logo.png'

export const APP_NAME = 'Rent House.lk'

/** The Rent House.lk logo (transparent PNG, ~3.4:1). Size it with a height class. */
export default function Logo({ className = 'h-10' }) {
  return <img src={logo} alt={APP_NAME} className={`w-auto ${className}`} width="900" height="262" />
}
