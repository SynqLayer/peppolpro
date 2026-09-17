# PeppolPro compliance / UX audit — 17 september 2026

Scope: publieke website, registratie, checkout, privacy/juridische informatie, marketingclaims, cookies/tracking, derde partijen, basistoegankelijkheid en CI-signalen. Geen productie-infrastructuur of database is gewijzigd.

## Samenvatting

De audit vond vooral risico's in **absolute productclaims**, **verouderde e-facturatieregels**, **een checkout die te snel doorstuurde naar Mollie**, ontbrekende juridische self-servicepagina's en onvoldoende specifieke AVG-informatie. De direct in code oplosbare punten zijn in deze branch aangepast.

Tijdens CI kwamen daarnaast twee bestaande repo-/productierisico's naar voren: drie toegepaste Supabase-migraties ontbreken in Git en `npm ci` rapporteert 4 dependency findings (1 moderate, 2 high, 1 critical). Deze zijn bewust niet weggepoetst of automatisch gefixt; ze staan als aparte P1-issues open.

## 20-punts audit

| # | Onderdeel | Status na deze branch | Bevinding / wijziging |
|---|---|---|---|
| 1 | Privacy policy | Verbeterd | Grondslagen, doeleinden, bewaartermijnen, derden, EER-doorgifte, AP-klacht, kinderen, AI en rechten expliciet gemaakt. |
| 2 | Terms of service | Verbeterd | Huidig productmodel, B2B-scope, credits, monitoring, Peppol-providerrol, controleplicht, btw/prijs en aansprakelijkheid herschreven. |
| 3 | Refund policy | Toegevoegd | `/annuleren-terugbetaling` voor abonnement, bundels, dubbele/foutieve betalingen en technische creditcorrecties. |
| 4 | Cookie policy | Toegevoegd | `/cookiebeleid` documenteert Supabase auth/PKCE en tijdelijke checkout-intentcookie. |
| 5 | Cookie consent banner | Bewust niet toegevoegd | Er zijn geen niet-noodzakelijke analytics-/advertentiecookies gevonden. Een toestemmingsbanner voor uitsluitend noodzakelijke cookies zou misleidend zijn. Voeg consent gating toe vóór toekomstige niet-noodzakelijke tracking. |
| 6 | Form consents | Verbeterd | Registratie vereist een afzonderlijke zakelijke 18+/bevoegdheids- en voorwaardenbevestiging. Contactformulier gebruikt geen onnodige verplichte privacycheckbox. Checkout vereist aparte expliciete aankoopbevestiging. |
| 7 | No unnecessary data | Verbeterd / monitoren | Contactformulier beperkt velden en lengtes; deletion request vraagt geen ID-kopie. Factuurdata blijft functioneel noodzakelijk. |
| 8 | Audit third-party SDKs | Geaudit | Functioneel aangetroffen: Supabase, Gemini/Google, Mollie, Brevo, Recommand, VIES/PDOK, Vercel, pdf-lib/Recharts. Geen advertentie-/analytics-SDK aangetroffen. Contract/DPA/dataregio blijft een operationele verificatie. |
| 9 | Remove dark patterns | Verbeterd | Prijskaart/login start niet meer automatisch Mollie. Reviewpagina toont bedrag, type aankoop, voorwaarden en vereist bevestiging. Niet-onderbouwde `Populair`-badge verwijderd. |
| 10 | Remove hidden fees | Verbeterd | Publieke bedragen als `incl. btw` gemarkeerd; eenmalige bundels versus maandabonnementen duidelijker. Internationale fiscale behandeling blijft apart P1-aandachtspunt. |
| 11 | Remove fake reviews | Geen probleem gevonden | Geen testimonials, sterrenratings of verzonnen klantreviewcomponenten gevonden. |
| 12 | Remove unsupported claims | Sterk verbeterd | `100% conform`, `alle PDF's`, `elk access point`, algemene `AVG/GDPR compliant` en verlopen ISO-belofte verwijderd of genuanceerd. |
| 13 | Accessibility alt text | Geen ontbrekende content-images gevonden | Geen `<img>` of Next `<Image>` in de onderzochte appcode gevonden. Decoratieve emoji's in aangepaste homepage zijn waar relevant `aria-hidden`. |
| 14 | Fix color contrast | Verbeterd | `C.dim` verhoogd naar leesbaarder slate-400; zeer zwakke footerlinks vervangen; relevante dark-page teksten verhoogd. Volledige WCAG-audit blijft aanbevolen. |
| 15 | Keyboard navigation | Verbeterd | Globale `:focus-visible`, reduced-motion en ARIA-state op mobiele menu-toggle. Formuliervelden hebben labels. |
| 16 | Add business details | Verbeterd | SynqLayer, eigenaar, adres, KvK, btw-id en e-mail zichtbaar in Over ons/privacy/footer. Publiek telefoonnummer ontbreekt nog omdat geen geverifieerd nummer in repo beschikbaar was. |
| 17 | Age consent for kids' data | Verbeterd | Product expliciet B2B; privacy zegt niet voor kinderen; registratie bevestigt 18+ en bevoegdheid voor bedrijf/organisatie. |
| 18 | Unsubscribe link | Niet van toepassing op huidige flow | Geen nieuwsbrief/marketingmailflow gevonden. Brevo wordt in de code voor transactionele e-mail gebruikt. Daarom geen misleidende unsubscribe-link in noodzakelijke service-/factuurmails toegevoegd. |
| 19 | License fonts/images | Verbeterd | Externe Google Fonts import verwijderd; systeemfont gebruikt. Publieke SVG's zijn standaard projectassets en worden niet als marketingfotografie gebruikt; geen externe stockfoto's gevonden in onderzochte UI. |
| 20 | Data deletion request | Toegevoegd | `/privacy/verwijderen` met minimale identificatie, wettelijke bewaarplicht en éénmaands AVG-reactietermijn. |

## Extra kritieke bevindingen

### Checkout / aankoop

Voor de branch kon een prijskaart direct `/api/checkout` aanroepen. Na login kon een betaald plan eveneens automatisch een Mollie-checkout starten en `/checkout/resume` deed automatisch hetzelfde bij laden. Dat is vervangen door een expliciete review- en bevestigingsstap. De API accepteert een aankoop alleen met `confirmPurchase: true` en de actuele voorwaardenversie; bevestigingstijd en voorwaardenversie worden in payment metadata vastgelegd.

### België

De oude site stelde te breed dat Peppol voor alle Belgische btw-plichtige bedrijven gold, dat een Nederlandse leverancier met Belgische klanten door die Belgische verplichting moest meedoen en presenteerde een losse `€5.000`-boete. De actuele Belgische bronnen zijn specifieker:

- binnenlandse B2B e-facturatie geldt sinds 1 januari 2026 binnen het toepassingsgebied;
- niet in België gevestigde belastingplichtigen zonder vaste inrichting vallen volgens de Belgische uitleg buiten die specifieke plicht;
- de algemene tolerantie liep gedurende de eerste drie maanden van 2026;
- het ontbreken van de technische middelen kent voor die specifieke sanctie €1.500 / €3.000 / €5.000 bij opeenvolgende overtredingen; daarnaast bestaan andere fiscale boetes afhankelijk van de overtreding.

Bronnen:
- https://efactuur.belgium.be/nl/article/voor-wie-wordt-e-facturatie-verplicht
- https://efactuur.belgium.be/nl/news/tolerantieperiode-eerste-drie-maanden-2026
- https://efactuur.belgium.be/nl/FAQ/specifieke-vragen-over-e-facturatie
- https://efactuur.belgium.be/nl/article/wat-een-elektronische-factuur

### Nederland / ViDA

De oude Peppol-Check zei dat het brede Nederlandse mandaat nog `in consultatie / niet definitief` was. Op 11 september 2026 maakte het kabinet een concretere beleidskeuze bekend:

- e-facturatie vanaf **1 juli 2030** voor nationale en internationale B2B-transacties;
- binnenlandse rapportage vanaf **1 juli 2031**;
- volgens het kabinetsplan een vrijstelling voor KOR-ondernemers met maximaal €20.000 omzet per kalenderjaar;
- het nationale wetsvoorstel wordt naar verwachting vóór de zomer van 2027 ingediend.

Bron: https://www.rijksoverheid.nl/actueel/nieuws/2026/09/11/kabinet-kiest-voor-invoering-e-facturatie-en-rapportage-voor-bedrijven

De tekst zegt daarom niet dat de Nederlandse wet al definitief is, maar ook niet meer dat er geen gekozen datum bestaat.

### Peppol Directory

Een `niet gevonden`-resultaat mag niet als bewijs worden behandeld dat een organisatie niet op Peppol kan ontvangen. OpenPeppol geeft aan dat publicatie door SMP-serviceproviders in de Directory niet verplicht is en daarom niet iedere geregistreerde ontvanger vindbaar is.

Bron: https://peppol.org/support/

### AVG-reactietermijn

Artikel 12 AVG bepaalt in beginsel een reactietermijn van één maand voor verzoeken onder artikelen 15 t/m 22, met onder voorwaarden maximaal twee extra maanden bij complexiteit/aantal verzoeken en tijdige kennisgeving van de verlenging.

Bron: https://eur-lex.europa.eu/eli/reg/2016/679/oj

### CI / productiedatabase-drift

De productiedatabase rapporteert 45 toegepaste Supabase-migraties terwijl `main` 42 migratiebestanden bevat. De volgende drie toegepaste versies ontbreken in Git:

- `20260913200523 audit_p0_wallet_and_access`
- `20260913201349 audit_p0_send_reservations`
- `20260913201818 audit_p0_payment_adjustments`

De exacte SQL kon niet betrouwbaar uit de huidige Git-historie worden teruggevonden. Daarom zijn **geen lege of gereconstrueerde placeholdermigraties** toegevoegd. Issue #86 beschrijft de veilige herstelroute.

### Dependency security

`npm ci` rapporteerde in GitHub Actions op 17 september 2026 4 dependency findings: 1 moderate, 2 high en 1 critical. Dit wordt niet blind met `npm audit fix --force` opgelost. Issue #87 vraagt om advisory/CVE-triage, exploitability-check en minimaal veilige upgrades met volledige regressietests.

## Derden / SDK-overzicht

| Dienst | Functie in PeppolPro | Privacy/compliance aandachtspunt |
|---|---|---|
| Supabase | Auth, database, opslag | Projectregio, RLS en DPA/contract periodiek verifiëren. |
| Google Gemini | AI-factuurverwerking | Datadoorgifte/configuratie en providervoorwaarden periodiek verifiëren; geen absolute AI-nauwkeurigheid claimen. |
| Mollie | Betaling/abonnement | Financiële data en webhook-integriteit; eigen bewaarplicht respecteren. |
| Brevo | Transactionele e-mail | Geen marketingdoel aannemen zonder aparte grondslag/flow. |
| Recommand | Peppol-bedrijfsregistratie/verzending | Peppol-providerrol transparant houden; identiteitcontrole gebeurt extern. |
| VIES / PDOK | Btw-/adresvalidatie | Alleen benodigde lookupdata versturen. |
| Vercel | Hosting/runtime | Contract, regio en logginginstellingen periodiek controleren. |

## Open risico's vóór bredere commerciële uitrol

1. **P1 — internationale btw-behandeling (#82):** eigen PeppolPro billing-RPC's rekenen momenteel de btw uit met `1.21` / 21% als default. Dit moet vóór verkoop aan verschillende klanttypes/landen juridisch/fiscaal worden gemodelleerd, inclusief mogelijke btw-verlegging bij EU-B2B.
2. **P1 — database migration drift (#86):** drie op productie toegepaste Supabase-migraties ontbreken in Git. Eerst exacte historische SQL terugvinden en reconciliëren; geen placeholders gebruiken.
3. **P1 — dependency security (#87):** triage de 1 critical, 2 high en 1 moderate npm findings en patch zo klein mogelijk met volledige regressiecontrole.
4. **P2 — leverancierscontracten/privacy (#83):** code toont welke providers technisch worden gebruikt, maar niet of actuele DPA's, SCC's, subprocessorafspraken en gewenste dataregio's contractueel zijn vastgelegd.
5. **P2 — publiek telefoonnummer (#84):** geen geverifieerd SynqLayer/PeppolPro-nummer in de repo gevonden; daarom is bewust geen nummer verzonnen.

## CI-status van deze auditbranch

De CI is opgesplitst zodat bestaande productiedatabase-drift niet verhindert dat de PR-code zelf wordt getest. `migration-drift` blijft strict en rood zolang issue #86 niet is opgelost. De onafhankelijke `checks`-job voert `npm ci`, lint, typecheck, alle tests en een production Next.js build uit. Op de functionele commit vóór deze documentupdate waren lint, typecheck, tests en build volledig groen.

## Geen productieactie

Deze auditbranch is bedoeld voor review. Niet mergen of deployen zonder expliciete goedkeuring. Juridische teksten zijn praktische conceptteksten en verdienen vóór grootschalige commerciële inzet een finale controle door een Nederlandse jurist/fiscalist met ervaring in SaaS, AVG, e-commerce en btw/e-facturatie.
