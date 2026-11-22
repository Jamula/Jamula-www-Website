export const browserEgressIsolationAcknowledgement = "JAMULA_BROWSER_EGRESS_ISOLATION_ACK";

export function requireBrowserEgressIsolationAcknowledgement(env = process.env) {
  if (env[browserEgressIsolationAcknowledgement] !== "1") {
    throw new Error(
      `Refusing to launch the real-browser prototype: independently enforced external egress isolation is required. Set ${browserEgressIsolationAcknowledgement}=1 only after independently enforcing it; this acknowledgment does not verify or create isolation.`
    );
  }
}
