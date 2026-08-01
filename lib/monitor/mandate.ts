export type MandateAnswers = {
  suppliesGovernment: boolean;
  tradesB2bEu: boolean;
};

export type MandateIndication = {
  level: "laag" | "middel" | "hoog";
  title: string;
  bullets: string[];
};

export function getMandateIndication(answers: MandateAnswers): MandateIndication {
  if (answers.suppliesGovernment && answers.tradesB2bEu) {
    return {
      level: "hoog",
      title: "Hoge relevantie voor e-facturatie",
      bullets: [
        "Leveringen aan overheden vragen vaak al om gestructureerde e-facturen via Peppol of vergelijkbare kanalen.",
        "Bij B2B-handel met EU-landen is ViDA richting 2030 relevant, maar dit is geen vaste Nederlandse verplichtingsdatum voor elk bedrijf.",
        "Controleer per klant/contract welke factuurroute nu al vereist is.",
      ],
    };
  }

  if (answers.suppliesGovernment) {
    return {
      level: "hoog",
      title: "Relevant bij leveringen aan overheid",
      bullets: [
        "Als je aan overheden levert, kan e-facturatie via Peppol of een overheidskanaal contractueel of praktisch nodig zijn.",
        "Deze tool geeft alleen een indicatie; juridische verplichtingen hangen af van klant, contract en actuele regelgeving.",
      ],
    };
  }

  if (answers.tradesB2bEu) {
    return {
      level: "middel",
      title: "Let op EU B2B-ontwikkelingen",
      bullets: [
        "Voor grensoverschrijdende B2B-handel binnen de EU is ViDA richting 2030 relevant.",
        "Formuleer dit als voorbereiding/risicobeheersing, niet als vaststaande Nederlandse deadline.",
      ],
    };
  }

  return {
    level: "laag",
    title: "Geen directe harde indicatie gevonden",
    bullets: [
      "Voor reguliere NL-B2B facturatie is een breed Nederlands Peppol-mandaat nog geen vaststaande datum in deze tool.",
      "Peppol-ready worden kan alsnog nuttig zijn voor grotere klanten, overheden of toekomstige EU-regels.",
    ],
  };
}
