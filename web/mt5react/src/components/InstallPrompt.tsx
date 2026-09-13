import React, { useState, useEffect } from 'react';
import { Download, X, Share, Smartphone, Info } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const InstallPrompt: React.FC = () => {
    const { deferredPrompt, isInstalled, isIOS, promptInstall } = useInstallPrompt();
    const [showBanner, setShowBanner] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [manualInstall, setManualInstall] = useState(false);

    // Show the banner on every login (session-based dismiss)
    useEffect(() => {
        if (isInstalled) {
            setShowBanner(false);
            return;
        }
        const dismissedThisSession = sessionStorage.getItem('installPromptDismissed');
        if (dismissedThisSession === 'true') {
            setShowBanner(false);
            return;
        }
        const timer = setTimeout(() => setShowBanner(true), 1500);
        return () => clearTimeout(timer);
    }, [isInstalled]);

    // Handle the header "Install" button click
    useEffect(() => {
        const handleTrigger = () => {
            setShowBanner(true);
            handleInstall();
        };
        window.addEventListener('trigger-install', handleTrigger);
        return () => window.removeEventListener('trigger-install', handleTrigger);
    }, [deferredPrompt, isIOS]);

    const handleInstall = async () => {
        // On iOS — always show manual instructions
        if (isIOS) {
            setShowInstructions(true);
            return;
        }

        // Try browser's native install prompt
        if (deferredPrompt) {
            const accepted = await promptInstall();
            if (accepted) {
                setShowBanner(false);
            }
        } else {
            // Browser hasn't provided the prompt yet — show manual instructions
            setManualInstall(true);
            setShowInstructions(true);
        }
    };

    const handleDismiss = () => {
        sessionStorage.setItem('installPromptDismissed', 'true');
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <>
            {/* Install Banner */}
            <div className="fixed bottom-24 left-4 right-4 z-40 md:left-auto md:right-4 md:max-w-md">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/40 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex-shrink-0">
                        <Download size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm">
                            Install PipTrader App
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">
                            {isIOS
                                ? 'Add to home screen for the full-screen experience'
                                : 'Get alerts when SL or TP hits, like WhatsApp'}
                        </p>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleInstall}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                            >
                                Install
                            </button>
                            <button
                                onClick={() => setShowInstructions(true)}
                                className="text-slate-400 hover:text-white text-xs px-3 py-2 transition underline"
                            >
                                How?
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="text-slate-400 hover:text-white text-xs px-2 transition"
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

            {/* Instructions Modal */}
            {showInstructions && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Smartphone size={18} className="text-blue-400" />
                                {isIOS ? 'Install on iPhone' : 'Install PipTrader App'}
                            </h3>
                            <button
                                onClick={() => { setShowInstructions(false); setManualInstall(false); }}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {isIOS ? (
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
                        ) : (
                            <div className="space-y-4 text-sm text-slate-300">
                                {manualInstall && (
                                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
                                        <Info size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-yellow-200">
                                            Your browser hasn't offered auto-install yet. Follow the steps below to install manually.
                                        </p>
                                    </div>
                                )}
                                <ol className="space-y-3">
                                    <li className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                                        <p>Look at the <strong>address bar</strong> (top of Chrome)</p>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                                        <p>Click the <strong>⊕ Install icon</strong> on the right side (or the ⋮ menu → <em>Install PipTrader AI</em>)</p>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                                        <p>Click <strong>Install</strong> in the popup</p>
                                    </li>
                                </ol>
                            </div>
                        )}

                        <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                            <p className="text-xs text-blue-300">
                                💡 Once installed, the app works full-screen and can send you notifications.
                            </p>
                        </div>

                        <button
                            onClick={() => { setShowInstructions(false); setManualInstall(false); }}
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
