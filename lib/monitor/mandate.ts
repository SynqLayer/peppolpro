export type MandateAnswers = {
  suppliesGovernment: boolean;
  tradesB2bEu: boolean;
};

export type MandateIndication = {
  level: "laag" | "middel" | "hoog";
  title: string;
  bullets: string[];
};

const nl2030 = "Het kabinet heeft op 11 september 2026 gekozen voor verplichte e-facturatie per 1 juli 2030 voor nationale en internationale B2B-transacties; het nationale wetsvoorstel en uitvoeringsdetails worden nog uitgewerkt.";

export function getMandateIndication(answers: MandateAnswers): MandateIndication {
  if (answers.suppliesGovernment && answers.tradesB2bEu) {
    return {
      level: "hoog",
      title: "Hoge relevantie voor e-facturatie",
      bullets: [
        "Leveringen aan overheden kunnen nu al gestructureerde e-facturen via Peppol of vergelijkbare kanalen vereisen.",
        nl2030,
        "ViDA voert vanaf 1 juli 2030 digitale rapportage op basis van e-facturatie in voor grensoverschrijdende B2B-transacties binnen de EU.",
        "Controleer per klant, contract en land welke factuurroute nu al vereist is.",
      ],
    };
  }

  if (answers.suppliesGovernment) {
    return {
      level: "hoog",
      title: "Relevant bij leveringen aan overheid",
      bullets: [
        "Als je aan overheden levert, kan e-facturatie via Peppol of een overheidskanaal nu al contractueel of praktisch nodig zijn.",
        nl2030,
        "Deze tool geeft een indicatie; controleer de concrete aanbestedings- of inkoopvoorwaarden van je afnemer.",
      ],
    };
  }

  if (answers.tradesB2bEu) {
    return {
      level: "middel",
      title: "Bereid je voor op EU B2B-regels",
      bullets: [
        "Voor grensoverschrijdende B2B-handel binnen de EU zijn de ViDA-regels vanaf 1 juli 2030 relevant.",
        nl2030,
        "Een buitenlandse klant betekent niet automatisch dat een binnenlandse e-facturatieplicht van dat land op jouw factuur van toepassing is; controleer de regels voor de concrete transactie.",
      ],
    };
  }

  return {
    level: "laag",
    title: "Geen brede directe NL-B2B-plicht in 2026",
    bullets: [
      "Voor reguliere Nederlandse B2B-transacties geldt in 2026 nog geen brede algemene Peppol-plicht.",
      nl2030,
      "Volgens het kabinetsplan blijven ondernemers in de KOR (omzet maximaal €20.000 per kalenderjaar) vrijgesteld van de geplande e-facturatie- en rapportageplicht.",
    ],
  };
}
