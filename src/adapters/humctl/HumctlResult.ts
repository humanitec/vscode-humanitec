export class HumctlResult {
  constructor(
    public readonly stdout: string,
    public readonly stderr: string,
    public readonly exitcode: number
  ) {}
}
