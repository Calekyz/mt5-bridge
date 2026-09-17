import { runCommand, SshOpts } from './sshClient';

export const MT5_EXE_DEFAULT = 'C:\\Program Files\\MetaTrader 5\\terminal64.exe';
export const STARTUP_INI_DEFAULT = 'C:\\pipTrader\\startup.ini';

export async function killMT5(ssh: SshOpts): Promise<void> {
    await runCommand({ ...ssh, command: 'taskkill /IM terminal64.exe /F', timeoutMs: 15000 })
        .catch(() => {});
}

export async function isMT5Running(ssh: SshOpts): Promise<boolean> {
    const res = await runCommand({
        ...ssh,
        command: 'tasklist /FI "IMAGENAME eq terminal64.exe" /NH',
        timeoutMs: 15000,
    });
    return res.stdout.toLowerCase().includes('terminal64.exe');
}

export async function launchMT5(
    ssh: SshOpts,
    creds: { login: string; password: string; server: string; mt5Path?: string; startupIni?: string }
): Promise<void> {
    const mt5Path = creds.mt5Path || MT5_EXE_DEFAULT;
    const startupIni = creds.startupIni || STARTUP_INI_DEFAULT;
    const cmd =
        `start "" "${mt5Path}" ` +
        `/login:${creds.login} ` +
        `/password:${creds.password} ` +
        `/server:${creds.server} ` +
        `/config:"${startupIni}"`;

    await runCommand({ ...ssh, command: cmd, timeoutMs: 20000 });
}

export async function restartMT5WithCredentials(
    ssh: SshOpts,
    creds: { login: string; password: string; server: string; mt5Path?: string; startupIni?: string },
    waitMs = 15000
): Promise<{ running: boolean }> {
    await killMT5(ssh);
    await new Promise(r => setTimeout(r, 2000));
    await launchMT5(ssh, creds);
    await new Promise(r => setTimeout(r, waitMs));
    const running = await isMT5Running(ssh);
    return { running };
}
