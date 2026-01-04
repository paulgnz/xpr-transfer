import ProtonWebSDK from '@proton/web-sdk';
import type { Link, LinkSession, ProtonWebLink } from '@proton/web-sdk';
import { networks, type NetworkType } from '../config/networks';

const APP_NAME = 'XPR Transfer';
const REQUEST_ACCOUNT = 'xprtransfer';

export type WalletLink = Link | ProtonWebLink;

export interface WalletConnection {
  session: LinkSession;
  link: WalletLink;
}

export async function connectWallet(network: NetworkType): Promise<WalletConnection> {
  const config = networks[network];

  const { session, link } = await ProtonWebSDK({
    linkOptions: {
      chainId: config.chainId,
      endpoints: config.endpoints,
    },
    transportOptions: {
      requestAccount: REQUEST_ACCOUNT,
    },
    selectorOptions: {
      appName: APP_NAME,
    },
  });

  if (!session || !link) {
    throw new Error('Failed to establish wallet connection');
  }

  return { session, link };
}

export async function restoreSession(network: NetworkType): Promise<WalletConnection | null> {
  const config = networks[network];

  try {
    const { session, link } = await ProtonWebSDK({
      linkOptions: {
        chainId: config.chainId,
        endpoints: config.endpoints,
        restoreSession: true,
      },
      transportOptions: {
        requestAccount: REQUEST_ACCOUNT,
      },
      selectorOptions: {
        appName: APP_NAME,
      },
    });

    if (session && link) {
      return { session, link };
    }
    return null;
  } catch {
    return null;
  }
}

export async function disconnectWallet(
  link: WalletLink | null,
  session: LinkSession | null,
  chainId: string
): Promise<void> {
  if (link && session) {
    await link.removeSession(REQUEST_ACCOUNT, session.auth, chainId);
  }
}

export function getAccountName(session: LinkSession | null): string | null {
  if (!session?.auth?.actor) {
    return null;
  }
  return session.auth.actor.toString();
}
