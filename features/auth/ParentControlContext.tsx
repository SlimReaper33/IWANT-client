import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface ParentControlContextType {
  enabled: boolean
  toggle: (on: boolean) => Promise<void>
}

const KEY = 'parentControlEnabled'
const ParentControlContext = createContext<ParentControlContextType | undefined>(undefined)

export const ParentControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enabled, setEnabled] = useState(false)

  // при монтировании читаем из AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(KEY).then(val => {
      if (val === 'true') setEnabled(true)
    })
  }, [])

  const toggle = async (on: boolean) => {
    // здесь можно запросить PIN-код при включении/выключении
    // например, показать модалку и проверить
    await AsyncStorage.setItem(KEY, on ? 'true' : 'false')
    setEnabled(on)
  }

  return (
    <ParentControlContext.Provider value={{ enabled, toggle }}>
      {children}
    </ParentControlContext.Provider>
  )
}

export function useParentControl() {
  const ctx = useContext(ParentControlContext)
  if (!ctx) throw new Error('useParentControl must be inside ParentControlProvider')
  return ctx
}
