import { getDocumentStatus, sendDocument, verifyRecipient, verifyRecipientSupportsInvoice } from "../lib/recommand";

function buildTestInvoice() {
 const today = new Date().toISOString().slice(0, 10);
 const due = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
 return {
 invoiceNumber: `PEPPOLPRO-TEST-${Date.now()}`,
 issueDate: today,
 dueDate: due,
 note: "PeppolPro Recommand technische testverzending.",
 buyer: {
 vatNumber: "BE0123456789",
 name: "SynqLayer Test Recipient",
 street: "Teststraat 1",
 city: "Brussels",
 postalZone: "1000",
 country: "BE",
 },
 paymentMeans: [{ iban: "BE68539007547034" }],
 lines: [{
 name: "Technische PeppolPro test",
 description: "Testdocument voor Recommand API-integratie",
 quantity: "1.00",
 netPriceAmount: "1.00",
 vat: { category: "S", percentage: "21.00" },
 }],
 };
}

async function main() {
 const recipient = process.env.RECOMMAND_TEST_RECIPIENT_PEPPOL_ID;
 const companyId = process.env.RECOMMAND_COMPANY_ID;
 if (!recipient) throw new Error("RECOMMAND_TEST_RECIPIENT_PEPPOL_ID ontbreekt; niet raden voor testverzending.");
 if (!companyId) throw new Error("RECOMMAND_COMPANY_ID ontbreekt.");

 const verify = await verifyRecipient(recipient);
 if (!verify.isValid) {
 console.log(JSON.stringify({ step: "verify", verify }, null, 2));
 throw new Error("Recipient niet geldig; send geblokkeerd.");
 }
 const support = await verifyRecipientSupportsInvoice(recipient);
 if (!support.isValid) {
 console.log(JSON.stringify({ step: "verify-document-support", verify, support }, null, 2));
 throw new Error("Recipient ondersteunt invoice documenttype niet; send geblokkeerd.");
 }
 const send = await sendDocument(companyId, { recipient, documentType: "invoice", document: buildTestInvoice() });
 const documents = send.documentId ? await getDocumentStatus(send.documentId) : null;
 console.log(JSON.stringify({ verify: verify.raw, verifyDocumentSupport: support.raw, send: send.raw, documents }, null, 2));
}

main().catch((error) => {
 console.error(error instanceof Error ? error.message : error);
 process.exit(1);
});
