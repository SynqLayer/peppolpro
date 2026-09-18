// Controleert de twee regels waar dit op rust: de meting mag nooit een fout
// doorgeven aan een registratie of betaling, en er mag nooit meer dan de stapnaam
// de deur uit gaan. Plus de remmen die de funnel eerlijk houden.
import assert from 'node:assert/strict'
import test from 'node:test'
import { meldStap } from '../lib/synq-stap.ts'

function metBrowser({ track, opslag = new Map() } = {}) {
  const aanroepen = []
  const window = {
    synq: track === null ? undefined : { track: track || ((stap) => aanroepen.push([stap])) },
    localStorage: {
      getItem: (k) => (opslag.has(k) ? opslag.get(k) : null),
      setItem: (k, v) => opslag.set(k, v),
    },
  }
  globalThis.window = window
  return { aanroepen, opslag, opruimen: () => { delete globalThis.window } }
}

test('zonder browser (server) gebeurt er niets en valt er niets om', () => {
  delete globalThis.window
  assert.doesNotThrow(() => meldStap('signup_completed'))
})

test('zonder meetscript valt er niets om', () => {
  const { opruimen } = metBrowser({ track: null })
  try {
    assert.doesNotThrow(() => meldStap('signup_completed'))
  } finally {
    opruimen()
  }
})

test('een stap wordt alleen als stapnaam doorgegeven', () => {
  const { aanroepen, opruimen } = metBrowser()
  try {
    meldStap('signup_started')
    meldStap('signup_completed')
    assert.deepEqual(aanroepen, [['signup_started'], ['signup_completed']])
  } finally {
    opruimen()
  }
})

test('een meting die stukgaat blokkeert de registratie niet', () => {
  const { opruimen } = metBrowser({
    track: () => {
      throw new Error('meting kapot')
    },
  })
  try {
    assert.doesNotThrow(() => meldStap('signup_completed'))
  } finally {
    opruimen()
  }
})

test('opslag die weigert blokkeert de registratie niet', () => {
  globalThis.window = {
    synq: { track: () => {} },
    localStorage: {
      getItem: () => {
        throw new Error('opslag dicht')
      },
      setItem: () => {
        throw new Error('opslag dicht')
      },
    },
  }
  try {
    assert.doesNotThrow(() => meldStap('activated'))
  } finally {
    delete globalThis.window
  }
})

test('activering telt niet zonder aanmelding uit dezelfde browser', () => {
  const { aanroepen, opruimen } = metBrowser()
  try {
    meldStap('activated')
    assert.deepEqual(aanroepen, [])
  } finally {
    opruimen()
  }
})

test('na een aanmelding telt activering één keer, een betaling elke keer', () => {
  const { aanroepen, opruimen } = metBrowser()
  try {
    meldStap('signup_completed')
    meldStap('activated')
    meldStap('activated')
    meldStap('activated')
    meldStap('paid')
    meldStap('paid')
    assert.deepEqual(aanroepen, [['signup_completed'], ['activated'], ['paid'], ['paid']])
  } finally {
    opruimen()
  }
})

test('de invoer van de klant wordt nooit meegestuurd', () => {
  const { aanroepen, opruimen } = metBrowser()
  try {
    meldStap('signup_started')
    meldStap('signup_completed')
    for (const aanroep of aanroepen) {
      assert.equal(aanroep.length, 1)
      assert.equal(typeof aanroep[0], 'string')
      assert.equal(JSON.stringify(aanroep).includes('@'), false)
    }
  } finally {
    opruimen()
  }
})
