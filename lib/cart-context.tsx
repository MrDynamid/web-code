'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'

export type CartItem = {
  id: number
  slug: string
  name: string
  price: number
  image: string
  size: string
  color: string
  quantity: number
}

type CartState = { items: CartItem[] }

type CartAction =
  | { type: 'HYDRATE'; items: CartItem[] }
  | { type: 'ADD'; item: CartItem }
  | { type: 'REMOVE'; key: string }
  | { type: 'SET_QTY'; key: string; quantity: number }
  | { type: 'CLEAR' }

const STORAGE_KEY = 'maison-lumiere-cart'

export function lineKey(item: Pick<CartItem, 'id' | 'size' | 'color'>) {
  return `${item.id}-${item.size}-${item.color}`
}

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return { items: action.items }
    case 'ADD': {
      const key = lineKey(action.item)
      const existing = state.items.find((i) => lineKey(i) === key)
      if (existing) {
        return {
          items: state.items.map((i) =>
            lineKey(i) === key
              ? { ...i, quantity: i.quantity + action.item.quantity }
              : i,
          ),
        }
      }
      return { items: [...state.items, action.item] }
    }
    case 'REMOVE':
      return { items: state.items.filter((i) => lineKey(i) !== action.key) }
    case 'SET_QTY':
      return {
        items: state.items.map((i) =>
          lineKey(i) === action.key
            ? { ...i, quantity: Math.max(1, action.quantity) }
            : i,
        ),
      }
    case 'CLEAR':
      return { items: [] }
    default:
      return state
  }
}

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  hydrated: boolean
  addItem: (item: CartItem) => void
  removeItem: (key: string) => void
  setQuantity: (key: string, quantity: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) dispatch({ type: 'HYDRATE', items: JSON.parse(raw) })
    } catch {
      // ignore malformed storage
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
  }, [state.items, hydrated])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0)
    const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    return {
      items: state.items,
      itemCount,
      subtotal,
      hydrated,
      addItem: (item) => dispatch({ type: 'ADD', item }),
      removeItem: (key) => dispatch({ type: 'REMOVE', key }),
      setQuantity: (key, quantity) => dispatch({ type: 'SET_QTY', key, quantity }),
      clear: () => dispatch({ type: 'CLEAR' }),
    }
  }, [state.items, hydrated])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
