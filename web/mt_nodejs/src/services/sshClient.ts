import { Client } from 'ssh2';

export interface SshOpts {
    host: string;
    username: string;
    password?: string;
    privateKey?: string;
    port?: number;
}

export interface SshResult {
    code: number;
    stdout: string;
    stderr: string;
}

export function runCommand(opts: SshOpts & { command: string; timeoutMs?: number }): Promise<SshResult> {
    const { host, username, password, privateKey, port = 22, command, timeoutMs = 30000 } = opts;

    return new Promise((resolve, reject) => {
        const conn = new Client();
        let settled = false;

        const finish = (fn: (v: any) => void, arg: any) => {
            if (settled) return;
            settled = true;
            try { conn.end(); } catch {}
            fn(arg);
        };

        const timer = setTimeout(
            () => finish(reject, new Error(`SSH timed out after ${timeoutMs}ms`)),
            timeoutMs
        );

        conn.on('ready', () => {
            conn.exec(command, (err, stream) => {
                if (err) return finish(reject, err);
                let stdout = '';
                let stderr = '';
                stream.on('data', (d: Buffer) => { stdout += d.toString('utf8'); });
                stream.stderr.on('data', (d: Buffer) => { stderr += d.toString('utf8'); });
                stream.on('close', (code: number) => {
                    clearTimeout(timer);
                    finish(resolve, { code, stdout, stderr });
                });
            });
        });

        conn.on('error', (err) => {
            clearTimeout(timer);
            finish(reject, err);
        });

        const config: any = { host, port, username, readyTimeout: timeoutMs };
        if (password) config.password = password;
        if (privateKey) config.privateKey = privateKey;

        try { conn.connect(config); }
        catch (err) { clearTimeout(timer); finish(reject, err); }
    });
}

export async function testConnection(opts: SshOpts): Promise<boolean> {
    try {
        const res = await runCommand({ ...opts, command: 'echo ok' });
        return res.code === 0 && res.stdout.includes('ok');
    } catch { return false; }
}
