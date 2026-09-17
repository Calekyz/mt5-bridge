/**
 * sshClient.js
 * Thin wrapper around ssh2 for running commands on a remote (Windows) VPS.
 */

const { Client } = require('ssh2');

/**
 * Run a single command on a remote host over SSH.
 * @param {object} opts
 * @param {string} opts.host
 * @param {string} opts.username
 * @param {string} [opts.password]
 * @param {string} [opts.privateKey]
 * @param {number} [opts.port=22]
 * @param {string} opts.command
 * @param {number} [opts.timeoutMs=30000]
 * @returns {Promise<{code:number, stdout:string, stderr:string}>}
 */
function runCommand(opts) {
    const {
        host,
        username,
        password,
        privateKey,
        port = 22,
        command,
        timeoutMs = 30000,
    } = opts;

    return new Promise((resolve, reject) => {
        const conn = new Client();
        let settled = false;

        const finish = (fn, arg) => {
            if (settled) return;
            settled = true;
            try { conn.end(); } catch (_) {}
            fn(arg);
        };

        const timer = setTimeout(() => {
            finish(reject, new Error(`SSH command timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        conn.on('ready', () => {
            conn.exec(command, (err, stream) => {
                if (err) return finish(reject, err);

                let stdout = '';
                let stderr = '';

                stream.on('data', (d) => { stdout += d.toString('utf8'); });
                stream.stderr.on('data', (d) => { stderr += d.toString('utf8'); });

                stream.on('close', (code) => {
                    clearTimeout(timer);
                    finish(resolve, { code, stdout, stderr });
                });
            });
        });

        conn.on('error', (err) => {
            clearTimeout(timer);
            finish(reject, err);
        });

        const config = { host, port, username, readyTimeout: timeoutMs };
        if (password) config.password = password;
        if (privateKey) config.privateKey = privateKey;

        try {
            conn.connect(config);
        } catch (err) {
            clearTimeout(timer);
            finish(reject, err);
        }
    });
}

/**
 * Test SSH connectivity.
 * @returns {Promise<boolean>}
 */
async function testConnection(opts) {
    try {
        const res = await runCommand({ ...opts, command: 'echo ok' });
        return res.code === 0 && res.stdout.includes('ok');
    } catch {
        return false;
    }
}

module.exports = { runCommand, testConnection };
