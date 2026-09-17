/**
 * mt5Launcher.js
 * Builds and runs the MT5 terminal launch command on a Windows VPS.
 *
 * Assumes:
 *  - MT5 installed at MT5_EXE_DEFAULT (override via opts.mt5Path)
 *  - startup.ini exists at STARTUP_INI_DEFAULT (override via opts.startupIni)
 *    containing:
 *      [StartUp]
 *      Profile=PipTrader_Auto
 */

const { runCommand } = require('./sshClient');

const MT5_EXE_DEFAULT = 'C:\\Program Files\\MetaTrader 5\\terminal64.exe';
const STARTUP_INI_DEFAULT = 'C:\\pipTrader\\startup.ini';

/**
 * Kill any running MT5 terminal on the VPS.
 * Non-zero exit is fine (no process running).
 */
async function killMT5({ host, username, password, privateKey, port }) {
    return runCommand({
        host, username, password, privateKey, port,
        command: 'taskkill /IM terminal64.exe /F',
        timeoutMs: 15000,
    }).catch(() => ({ code: 0, stdout: '', stderr: '' }));
}

/**
 * Check if MT5 is currently running.
 */
async function isMT5Running({ host, username, password, privateKey, port }) {
    const res = await runCommand({
        host, username, password, privateKey, port,
        command: 'tasklist /FI "IMAGENAME eq terminal64.exe" /NH',
        timeoutMs: 15000,
    });
    return res.stdout.toLowerCase().includes('terminal64.exe');
}

/**
 * Launch MT5 with login + config.
 */
async function launchMT5({
    host, username, password, privateKey, port,
    mt5Login, mt5Password, mt5Server,
    mt5Path = MT5_EXE_DEFAULT,
    startupIni = STARTUP_INI_DEFAULT,
}) {
    const cmd =
        `start "" "${mt5Path}" ` +
        `/login:${mt5Login} ` +
        `/password:${mt5Password} ` +
        `/server:${mt5Server} ` +
        `/config:"${startupIni}"`;

    return runCommand({
        host, username, password, privateKey, port,
        command: cmd,
        timeoutMs: 20000,
    });
}

/**
 * Full sequence: kill -> wait -> launch -> wait -> verify.
 */
async function restartMT5WithCredentials(opts, { waitMs = 15000 } = {}) {
    await killMT5(opts);
    await new Promise(r => setTimeout(r, 2000));
    await launchMT5(opts);
    await new Promise(r => setTimeout(r, waitMs));
    const running = await isMT5Running(opts);
    return { running };
}

module.exports = {
    killMT5,
    launchMT5,
    isMT5Running,
    restartMT5WithCredentials,
    MT5_EXE_DEFAULT,
    STARTUP_INI_DEFAULT,
};
