import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, Role } from '@/types'

type SignUpInput = {
  fullName: string
  email: string
  phone: string
  password: string
}

type AuthContextValue = {
  session: Session | null
  user: User | null
  profile: Profile | null
  role: Role | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<Profile>
  signUp: (input: SignUpInput) => Promise<{ needsConfirmation: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data as Profile
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const next = await fetchProfile(userId)
      setProfile(next)
    } catch {
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)

      if (!nextSession) {
        setProfile(null)
        setIsLoading(false)
        return
      }

      void loadProfile(nextSession.user.id)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const nextProfile = await fetchProfile(data.user.id)
    setSession(data.session)
    setProfile(nextProfile)
    setIsLoading(false)
    return nextProfile
  }, [])

  const signUp = useCallback(async (input: SignUpInput) => {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          phone: input.phone,
        },
      },
    })
    if (error) throw error

    if (data.session && data.user) {
      const nextProfile = await fetchProfile(data.user.id)
      setSession(data.session)
      setProfile(nextProfile)
      setIsLoading(false)
      return { needsConfirmation: false }
    }

    return { needsConfirmation: true }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return
    const next = await fetchProfile(session.user.id)
    setProfile(next)
  }, [session])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [session, profile, isLoading, signIn, signUp, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
