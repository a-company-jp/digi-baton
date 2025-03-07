import { API_BASE_URL } from './base';

async function getAvailableCredentialIds(rpId: string, credentialIds: string[]): Promise<string[]> {
  try {
    const response = await fetch(API_BASE_URL + `/check-passkeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rpId,
        credentialIds,
      }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const result = await response.json();
    return result.availableCredentialIds || [];
  } catch (error) {
    console.error('Error checking passkey existence:', error);
    return [];
  }
}

export { getAvailableCredentialIds };
