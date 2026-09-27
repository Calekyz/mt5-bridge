/**
 * termsContent.ts
 * Canonical Terms & Conditions text.
 * Changing this requires bumping TERMS_VERSION.
 */

export const TERMS_VERSION = '1.0';
export const TERMS_EFFECTIVE_DATE = '27 September 2026';

export const TERMS_SECTIONS = [
    {
        number: '1',
        title: 'Introduction and Parties',
        body: `These Terms and Conditions ("Terms") constitute a legally binding agreement between you ("User", "you") and CALEKYZ DIGITALISED SERVICE ENTERPRISES, a business registered under the Registrar of Companies in the Republic of Kenya ("Company", "we", "us", "our"), governing your access to and use of the PipTrader AI platform, including all associated software, algorithms, dashboards, servers, and services (collectively, the "Platform").

By creating an account, logging in, or otherwise accessing the Platform, you confirm that you have read, understood, and agree to be bound by these Terms in their entirety. If you do not agree, you must immediately cease use of the Platform.`,
    },
    {
        number: '2',
        title: 'Eligibility',
        body: `You may use the Platform only if:

(a) You are at least eighteen (18) years of age;
(b) You have the legal capacity to enter into binding contracts in your jurisdiction;
(c) You are not prohibited by any applicable law from using automated trading software; and
(d) All information you provide to the Company is accurate, current, and complete.

The Company reserves the right to refuse service, terminate accounts, or restrict access at its sole discretion, particularly where it reasonably suspects fraudulent, illegal, or abusive activity.`,
    },
    {
        number: '3',
        title: 'Nature of the Service',
        body: `The Platform provides automated trading software ("Algorithms") that execute trades on third-party MetaTrader 5 (MT5) accounts configured by the User. The Platform includes but is not limited to the following algorithms: PipNex, NOVA Edge AI, SMC Swing Trader, and Punex Asian Session.

The Company provides software and infrastructure only. The Company does NOT:
(a) Provide financial, investment, tax, or legal advice;
(b) Manage client funds or hold any client monies;
(c) Guarantee any trading outcome, profit, or performance;
(d) Act as a broker, dealer, fund manager, or investment adviser.

All trading decisions, risk parameters, and account configurations remain the sole responsibility of the User.`,
    },
    {
        number: '4',
        title: 'Risk Disclosure and Acknowledgment',
        body: `Trading foreign exchange (Forex), Contracts for Difference (CFDs), precious metals, indices, and other financial instruments carries a HIGH LEVEL OF RISK and may not be suitable for all investors. You expressly acknowledge and accept the following risks:

(a) LEVERAGE RISK: The use of leverage can amplify both profits and losses. Losses may exceed your initial deposit depending on the broker's terms.

(b) CAPITAL LOSS RISK: You may lose some or all of your invested capital. You should never trade with money you cannot afford to lose.

(c) AUTOMATED TRADING RISK: Algorithms may malfunction, execute unintended trades, fail to execute intended trades, or respond unpredictably to market conditions such as volatility spikes, news events, or broker outages.

(d) MARKET RISK: Financial markets are volatile and unpredictable. Past performance, whether live or backtested, is NOT indicative of future results.

(e) TECHNOLOGY RISK: The Platform depends on third-party infrastructure including VPS providers, internet connectivity, brokers, and MT5 terminals. Outages, latency, or failures may result in missed or delayed executions.

(f) THIRD-PARTY BROKER RISK: The Company is not affiliated with, and does not control, your chosen broker. Broker actions, spreads, slippage, requotes, and policies may affect trading outcomes.

(g) REGULATORY RISK: Regulations governing automated trading vary by jurisdiction. It is your responsibility to ensure compliance in your jurisdiction.

BY USING THE PLATFORM, YOU CONFIRM THAT YOU UNDERSTAND THESE RISKS AND ACCEPT FULL RESPONSIBILITY FOR ANY FINANCIAL LOSSES INCURRED.`,
    },
    {
        number: '5',
        title: 'No Guarantee of Profitability',
        body: `The Company makes no representation, warranty, or guarantee regarding:

(a) The profitability or performance of any Algorithm;
(b) The accuracy or reliability of any signals, analytics, or recommendations;
(c) The suitability of the Platform for your specific financial situation, risk tolerance, or investment objectives.

Any performance statistics, screenshots, testimonials, or historical results published by the Company are illustrative only and do not constitute a promise of future performance.`,
    },
    {
        number: '6',
        title: 'User Responsibilities',
        body: `You agree to:

(a) Provide accurate and truthful information during registration and at all times thereafter;
(b) Maintain the confidentiality of your login credentials and access keys;
(c) Not share your account, credentials, or access keys with any third party;
(d) Ensure your MT5 account and broker are properly configured and funded;
(e) Monitor your account regularly and intervene as necessary;
(f) Set appropriate Stop Loss and Take Profit limits via the Risk Guard feature;
(g) Comply with all applicable laws and regulations in your jurisdiction;
(h) Not use the Platform for money laundering, terrorism financing, or any other unlawful purpose;
(i) Not reverse-engineer, decompile, resell, sublicense, or distribute any part of the Platform.`,
    },
    {
        number: '7',
        title: 'Account Suspension and Termination',
        body: `The Company reserves the right, at its sole discretion and without prior notice, to:

(a) Suspend, restrict, or terminate your access to the Platform;
(b) Remove your access keys, VPS assignments, or EA configurations;
(c) Refuse to provide service to any User;
(d) Report suspicious activity to relevant authorities.

Grounds for termination include but are not limited to: breach of these Terms, suspected fraud, chargebacks, abusive behavior towards staff, or violation of applicable laws.`,
    },
    {
        number: '8',
        title: 'Limitation of Liability',
        body: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, CALEKYZ DIGITALISED SERVICE ENTERPRISES, ITS OWNERS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR:

(a) Any trading losses, including losses arising from Algorithm malfunction;
(b) Lost profits, lost opportunity, or consequential, indirect, or punitive damages;
(c) Technical failures, server downtime, or data loss;
(d) Actions or omissions of third-party brokers, VPS providers, or payment processors;
(e) Any amount exceeding the total fees paid by you to the Company in the preceding twelve (12) months.

You agree to indemnify, defend, and hold harmless the Company from any claim, loss, or expense arising from your use of the Platform or breach of these Terms.`,
    },
    {
        number: '9',
        title: 'Intellectual Property',
        body: `All software, source code, algorithms, trade secrets, dashboards, logos, brand names, and documentation associated with the Platform are the exclusive property of CALEKYZ DIGITALISED SERVICE ENTERPRISES and are protected by copyright and intellectual property laws.

You are granted a limited, non-exclusive, non-transferable, revocable license to use the Platform for your personal trading purposes only. This license does not grant ownership of any intellectual property.`,
    },
    {
        number: '10',
        title: 'Payment and Refunds',
        body: `Subscription fees, lifetime access fees, and any other charges are stated in United States Dollars (USD) or Kenyan Shillings (KES) at the time of purchase. All payments are final.

The Company does not offer refunds except in cases where the Platform is proven to be fundamentally non-functional and the Company is unable to remedy the issue within thirty (30) days of written notice. Chargebacks and payment disputes will result in immediate account termination.`,
    },
    {
        number: '11',
        title: 'Data Protection and Privacy',
        body: `You consent to the collection, storage, and processing of your personal data, including your email address, MT5 credentials, acceptance records, IP address, and technical logs, for the purpose of operating the Platform.

MT5 credentials are stored on the Company's backend servers solely to configure your assigned Virtual Private Server (VPS). Access is restricted to authorized personnel.

The Company will not sell, rent, or share your data with third parties except as required by law or to operate the Platform.`,
    },
    {
        number: '12',
        title: 'Modifications to These Terms',
        body: `The Company reserves the right to modify these Terms at any time. Material changes will be communicated via email or a notice within the Platform. Your continued use of the Platform after such changes constitutes acceptance of the revised Terms.

Each version of these Terms is assigned a version number. Your acceptance of a specific version is recorded and preserved. If the Company publishes a new version, you may be required to accept the revised Terms to continue using the Platform.`,
    },
    {
        number: '13',
        title: 'Governing Law and Dispute Resolution',
        body: `These Terms shall be governed by and construed in accordance with the laws of the Republic of Kenya.

Any dispute arising out of or relating to these Terms shall first be attempted to be resolved through good-faith negotiation. If unresolved within thirty (30) days, the dispute shall be submitted to the exclusive jurisdiction of the courts of Kenya.

You agree that any claim must be brought individually and not as part of a class action.`,
    },
    {
        number: '14',
        title: 'Acceptance',
        body: `By ticking the acceptance checkbox during signup or login, you confirm that:

(a) You have read these Terms in full;
(b) You understand and accept the risk disclosure in Section 4;
(c) You agree to be legally bound by these Terms;
(d) You are at least 18 years of age and legally competent.

Your acceptance is recorded with a timestamp, IP address, and content hash for audit and dispute-resolution purposes.`,
    },
];

/**
 * Returns the full terms text as a single plain-text string.
 * Used for PDF generation and hashing.
 */
export function getTermsFullText(): string {
    const lines = [
        `TERMS AND CONDITIONS`,
        `CALEKYZ DIGITALISED SERVICE ENTERPRISES`,
        `Version: ${TERMS_VERSION}`,
        `Effective Date: ${TERMS_EFFECTIVE_DATE}`,
        `Registered under the Registrar of Companies, Republic of Kenya`,
        ``,
        `=================================================================`,
        ``,
    ];

    for (const section of TERMS_SECTIONS) {
        lines.push(`${section.number}. ${section.title.toUpperCase()}`);
        lines.push(``);
        lines.push(section.body);
        lines.push(``);
        lines.push(`-----------------------------------------------------------------`);
        lines.push(``);
    }

    lines.push(`END OF TERMS AND CONDITIONS`);
    lines.push(`Version ${TERMS_VERSION}`);
    lines.push(`Accepted by user on the date shown below.`);
    lines.push(`=================================================================`);

    return lines.join('\n');
}
