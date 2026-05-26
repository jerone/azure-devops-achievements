import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, ILocationService } from "azure-devops-extension-api";

let cachedOrgUrl: string | undefined;

async function getOrgUrl(): Promise<string> {
  if (cachedOrgUrl) return cachedOrgUrl;
  const locationService = await SDK.getService<ILocationService>(
    CommonServiceIds.LocationService
  );
  cachedOrgUrl = await locationService.getServiceLocation();
  // Ensure trailing slash
  if (!cachedOrgUrl.endsWith("/")) cachedOrgUrl += "/";
  return cachedOrgUrl;
}

/** Returns the avatar URL for a subject descriptor (non-deprecated approach). */
export async function getAvatarUrl(descriptor: string): Promise<string> {
  const orgUrl = await getOrgUrl();
  return `${orgUrl}_apis/GraphProfile/MemberAvatars/${descriptor}`;
}
