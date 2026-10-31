# Two Free Azure Static Web Apps

Cyrus approved two Free apps to serve all four hostnames directly, without cross-host redirects.

| App | Hostnames | Azure hostname |
| --- | --- | --- |
| swa-jamula-web-prod | jamula.net, www.jamula.net | ashy-beach-033c7d01e.7.azurestaticapps.net |
| swa-jamula-com-prod | jamula.com, www.jamula.com | red-cliff-0ee064a1e.2.azurestaticapps.net |

The production workflow builds one artifact and deploys it to both apps. Pull request previews remain on the original .net app only. The additional deployment uses repository secret AZURE_STATIC_WEB_APPS_API_TOKEN_SWA_JAMULA_COM_PROD; never commit its value.

Leave the Azure default-domain redirect unset on both apps. HTTP should redirect to HTTPS on the same hostname. Azure provisions and renews certificates after custom-domain validation. Keep existing jamula.net canonical HTML tags for search indexing; these do not redirect visitors.

Microsoft 365 remains the authoritative DNS host. Preserve nameservers, MX, SPF, DKIM, autodiscover, and other mail/service records. Add only Azure ownership TXT and web A/CNAME records. Azure reports the .com app's regional stableInboundIP as 20.72.253.180; retrieve that property again before changing the apex A record. Use the generated hostname for the www CNAME. An apex A record serves a single Azure region rather than providing alias-based global distribution.

Verify all four HTTPS URLs return 200 without cross-host redirects, valid TLS certificates, and matching site content. Verify each HTTP URL redirects to the same hostname over HTTPS. Recheck MX/SPF/DKIM after DNS changes.

Rollback: revert the companion deployment job to stop updates to the second app; retain the original .net app. Remove only the explicitly added .com web records if undoing .com hosting. Remove the new app and its deployment secret only after deciding to retire it. Do not reset the entire DNS zone.
