'use client'

import { useEffect } from 'react'
import { meldStap, type KlantStap } from '@/lib/synq-stap'

/**
 * Meldt een stap zodra deze pagina in de browser verschijnt.
 *
 * Bewust een apart, onzichtbaar onderdeel: zo hoeft er geen bestaande pagina
 * omgebouwd te worden en kan het melden ook nooit de pagina zelf laten stuklopen.
 */
export default function MeldStap({ stap }: { stap: KlantStap }) {
  useEffect(() => {
    meldStap(stap)
  }, [stap])

  return null
}
