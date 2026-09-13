# P1-03 unique invoice identity

The billing RPC locks the payment row and returns an existing invoice before validating mutable profile data or allocating another invoice number. A unique partial index permits one original billing invoice per payment regardless of whether its kind is credits or subscription. A separate index protects the current full-credit-note path. Future partial-refund support must use individual provider adjustment identities rather than relaxing uniqueness without a replacement key.

An isolated PostgreSQL test sends twenty concurrent calls for the same payment: all return the same invoice identity, exactly one invoice exists and the annual sequence equals one. A retry after removing the current billing address still returns the original identity. A direct duplicate insert of a different original invoice kind is rejected by the unique index.

Full lint, typecheck, 247 tests and production build passed. The repaired harness recorded zero INFRA retries in this gate. This is local synthetic-data verification; no production SQL has been applied.
