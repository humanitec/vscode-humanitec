export class DeviceAuthorizationInfo {
  constructor(
    public readonly securityCode: string,
    public readonly verificationUrl: string,
    public readonly deviceId: string
  ) {}
}
