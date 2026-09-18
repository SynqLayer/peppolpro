/**
 * Meldt een stap uit het klantpad aan de eigen, cookieloze meting.
 *
 * Twee harde regels, en die zijn belangrijker dan de meting zelf:
 *
 * 1. Dit mag NOOIT een registratie, bevestiging of betaling raken. Daarom is het
 *    synchroon, zonder await, en slikt het elke fout. Gaat de meting stuk, dan
 *    merkt de klant daar niets van.
 * 2. Er gaat nooit iets mee wat op een persoon wijst: alleen de naam van de stap.
 *    Geen e-mailadres, geen gebruikers-id, geen bedrag, geen invoer van de klant.
 *
 * Waarom de remmen hieronder: de funnel telt gebeurtenissen, geen mensen. Zonder
 * rem zou een terugkerende bezoeker de cijfers opblazen en zou "geactiveerd" boven
 * "aangemeld" uitkomen, wat niets betekent.
 */

export type KlantStap = 'signup_started' | 'signup_completed' | 'activated' | 'paid'

const SLEUTEL = 'peppolpro_synq'

// Stappen die maar één keer per browser mogen tellen.
const EENMALIG: Partial<Record<KlantStap, string>> = {
  activated: `${SLEUTEL}_geactiveerd`,
}

// Activering zeggen we alleen als deze browser zich ook echt heeft aangemeld.
// Anders zou een bestaande gebruiker die toevallig in de meetperiode inlogt als
// "geactiveerd" tellen zonder dat er een aanmelding tegenover staat.
const NA_AANMELDING: Partial<Record<KlantStap, string>> = {
  activated: `${SLEUTEL}_aangemeld`,
}

type Meting = { synq?: { track?: (stap: string) => void } }

function vlag(action: 'get' | 'set', sleutel: string): boolean {
  if (action === 'get') return window.localStorage.getItem(sleutel) === '1'
  window.localStorage.setItem(sleutel, '1')
  return true
}

export function meldStap(stap: KlantStap): void {
  try {
    if (typeof window === 'undefined') return

    const meting = window as unknown as Meting
    if (!meting.synq || typeof meting.synq.track !== 'function') return

    if (stap === 'signup_completed') vlag('set', `${SLEUTEL}_aangemeld`)

    const voorwaarde = NA_AANMELDING[stap]
    if (voorwaarde && !vlag('get', voorwaarde)) return

    const bewaarsleutel = EENMALIG[stap]
    if (bewaarsleutel) {
      if (vlag('get', bewaarsleutel)) return
      vlag('set', bewaarsleutel)
    }

    meting.synq.track(stap)
  } catch {
    // Bewust stil. Meten mag nooit een klantpad blokkeren.
  }
}
