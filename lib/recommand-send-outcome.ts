export type SendExceptionState = {
 sendAttempted: boolean;
 providerOutcomeKnown: boolean;
 providerAccepted: boolean;
};

export type SendExceptionDisposition = "provider_outcome_unknown" | "provider_accepted" | "safe_to_release";

export function classifySendException(state: SendExceptionState): SendExceptionDisposition {
 if (state.sendAttempted && !state.providerOutcomeKnown) return "provider_outcome_unknown";
 if (state.providerAccepted) return "provider_accepted";
 return "safe_to_release";
}
