import { randomBytes } from 'crypto';
import { DeviceAuthorizationInfo } from '../domain/DeviceAuthorizationInfo';
import { AuthorizationError } from '../errors/AuthorizationError';
import { AuthorizationDeclined } from '../errors/AuthorizationDeclined';

export interface ILoginService {
  initDeviceAuthorization(): Promise<DeviceAuthorizationInfo>;
  confirmDeviceAuthorization(info: DeviceAuthorizationInfo): Promise<string>;
}

interface DeviceResponse {
  security_code: string;
  verification_url: string;
}

interface DevicePollResponse {
  accepted: boolean;
  access_token: string;
}

export class LoginService implements ILoginService {
  constructor() {}
  async initDeviceAuthorization(): Promise<DeviceAuthorizationInfo> {
    const deviceId = randomBytes(20).toString('hex');
    const response = await fetch('https://api.humanitec.io/auth/device', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ device_id: deviceId }),
    });
    if (response.status !== 200) {
      throw new AuthorizationError(await response.text());
    }
    const body = (await response.json()) as DeviceResponse;
    if (!body.security_code || !body.verification_url) {
      throw new AuthorizationError(await response.text());
    }
    return new DeviceAuthorizationInfo(
      body.security_code,
      body.verification_url,
      deviceId
    );
  }
  async confirmDeviceAuthorization(
    info: DeviceAuthorizationInfo
  ): Promise<string> {
    while (true) {
      const response = await fetch(
        'https://api.humanitec.io/auth/device-poll',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ security_code: info.securityCode }),
        }
      );
      if (response.status === 200) {
        const body = (await response.json()) as DevicePollResponse;
        if (!body.accepted) {
          throw new AuthorizationError(await response.text());
        }
        if (!body.accepted) {
          throw new AuthorizationDeclined();
        }
        if (!body.access_token) {
          throw new AuthorizationError(await response.text());
        }
        return body.access_token;
      } else if (response.status !== 202) {
        throw new AuthorizationError(await response.text());
      }
      await new Promise(resolve => {
        setTimeout(resolve, 1000);
      });
    }
  }
}
