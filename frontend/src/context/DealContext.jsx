import { createContext, useCallback, useContext, useState } from 'react'

// Whether the visitor is browsing properties for sale or for rent. Chosen on the home page
// (or the search toolbar) and remembered in this browser, so the whole site follows it.
export const DEALS = ['for_sale', 'for_rent']
const DEFAULT_DEAL = 'for_rent'
const STORAGE_KEY = 'renthouse.deal'

const DealContext = createContext({ deal: DEFAULT_DEAL, setDeal: () => {} })

function readDeal() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return DEALS.includes(saved) ? saved : DEFAULT_DEAL
  } catch {
    return DEFAULT_DEAL
  }
}

export function DealProvider({ children }) {
  const [deal, setDealState] = useState(readDeal)

  const setDeal = useCallback((next) => {
    if (!DEALS.includes(next)) return
    setDealState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage unavailable (private mode): the choice still holds for this visit.
    }
  }, [])

  return <DealContext.Provider value={{ deal, setDeal }}>{children}</DealContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDeal() {
  return useContext(DealContext)
}
