import React, { useState } from 'react';
import { Download, X, Share, Smartphone } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const InstallPrompt: React.FC = () => {
    const { deferredPrompt, isInstalled, isIOS, promptInstall } = useInstallPrompt();
    const [dismissed, setDismissed] = useState(() => {
        return localStorage.getItem('installPromptDismissed') === 'true';
    });
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    // Don't show if:
    // - already dismissed
    // - already installed
    // - no install prompt available (and not iOS)
    const shouldShow = !dismissed && !isInstalled && (deferredPrompt || isIOS);

    if (!shouldShow) return null;

    const handleInstall = async () => {
        if (isIOS) {
            setShowIOSInstructions(true);
            return;
        }
        const accepted = await promptInstall();
        if (accepted) {
            localStorage.setItem('installPromptDismissed', 'true');
        }
    };

    const handleDismiss = () => {
        localStorage.setItem('installPromptDismissed', 'true');
        setDismissed(true);
    };

    return (
        <>
            {/* Install Banner */}
            <div className="fixed bottom-20 left-4 right-4 z-40 md:left-auto md:right-4 md:max-w-sm">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/40 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex-shrink-0">
                        <Download size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm">
                            Install PipTrader App
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">
                            Get the full-screen experience on your phone
                        </p>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleInstall}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                            >
                                Install
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="text-slate-400 hover:text-white text-xs px-3 py-2 transition"
                            >
                                Later
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-slate-400 hover:text-white flex-shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* iOS Instructions Modal */}
            {showIOSInstructions && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Smartphone size={18} className="text-blue-400" />
                                Install on iPhone
                            </h3>
                            <button
                                onClick={() => setShowIOSInstructions(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <ol className="space-y-3 text-sm text-slate-300">
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                                <div>
                                    <p>Tap the <Share size={14} className="inline mx-1 text-blue-400" /> <strong>Share</strong> button</p>
                                    <p className="text-xs text-slate-400 mt-0.5">(bottom toolbar of Safari)</p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                                <p>Scroll down and tap <strong>Add to Home Screen</strong></p>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                                <p>Tap <strong>Add</strong> in the top-right</p>
                            </li>
                        </ol>

                        <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                            <p className="text-xs text-blue-300">
                                💡 Once installed, the app works full-screen and can send you notifications.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowIOSInstructions(false)}
                            className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default InstallPrompt;
