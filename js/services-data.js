/* ==================================================
   Services Data & Navigation Logic
================================================== */

const servicesData = {
    'income': {
        slug: 'income',
        page: 'income-tax.html',
        heroClass: 'hero-income-tax',
        heroImage: 'assets/images/hero-income-tax.jpg',
        image: 'assets/images/service-income-tax.jpg',
        title: 'Income Tax Filing',
        titleFull: 'Professional Income Tax Preparation',
        price: '$99',
        pricingDesc: 'For individuals, freelancers, and businesses looking for accurate and maximum refund filing.',
        desc: 'Our Income Tax Filing service takes the burden of tax season off your shoulders. We ensure your returns are accurate, filed on time, and optimized for maximum refunds.',
        descSecondary: 'Whether you\'re an individual with a simple W-2, a freelancer with 1099s, or an investor with complex capital gains, our certified accountants know how to navigate the tax code to your advantage.',
        benefits: [
            { icon: 'bi-shield-check', title: '100% Accuracy Guarantee', text: 'We back our work. If we make an error, we pay the penalty.' },
            { icon: 'bi-graph-up-arrow', title: 'Maximum Refund', text: 'We scan for hundreds of deductions to get your max refund.' },
            { icon: 'bi-clock-history', title: 'Save Time', text: 'No appointments needed. Upload files online in minutes.' },
            { icon: 'bi-file-earmark-lock', title: 'Bank-Level Security', text: 'Your financial documents are encrypted and secure.' }
        ],
        faqs: [
            { q: 'What documents do I need to provide?', a: 'Generally, you\'ll need a government-issued ID, last year\'s tax return, W-2s, 1099s, records of any deductions or credits, and bank account information for direct deposit.' },
            { q: 'How long does the process take?', a: 'Once all documents are uploaded, our experts typically prepare your return within 48-72 hours.' },
            { q: 'Can you help if I am being audited?', a: 'Yes, we offer complete audit representation. If you are audited for a return we prepared, we will assist you through the entire process.' }
        ],
        related: ['gst', 'bookkeeping', 'business-tax-planning']
    },
    'gst': {
        slug: 'gst',
        page: 'gst-returns.html',
        heroClass: 'hero-gst-returns',
        heroImage: 'assets/images/hero-gst-returns.jpg',
        image: 'assets/images/service-gst-returns.jpg',
        title: 'GST Returns',
        titleFull: 'Hassle-Free GST Filings & Compliance',
        price: '$79',
        pricingDesc: 'End-to-end GST compliance, input tax credit optimization, and timely return filing.',
        desc: 'We handle your entire GST process from registration to monthly and quarterly return filings, ensuring complete compliance and optimization of Input Tax Credit.',
        descSecondary: 'Never miss a filing deadline or lose eligible credits. Our specialists audit and file your returns accurately every cycle.',
        benefits: [
            { icon: 'bi-receipt-cutoff', title: 'ITC Optimization', text: 'Match invoices and maximize eligible Input Tax Credits.' },
            { icon: 'bi-alarm', title: 'Zero Deadline Penalties', text: 'Automated reminders and prompt filings to avoid late fees.' },
            { icon: 'bi-check-all', title: 'Error-Free Reconciliation', text: 'Comprehensive 2A/2B reconciliations before filing.' },
            { icon: 'bi-building', title: 'Multi-State Support', text: 'Manage multi-branch filings from a single centralized dashboard.' }
        ],
        faqs: [
            { q: 'Who is required to register for GST?', a: 'Businesses exceeding the statutory revenue threshold or engaging in inter-state supply must register for GST.' },
            { q: 'What is the frequency of GST returns?', a: 'Filings can be monthly or quarterly (e.g. QRMP scheme) depending on your business turnover and scheme.' },
            { q: 'How do you handle Input Tax Credit discrepancies?', a: 'Our automated reconciliation engine flags discrepancies with vendor filings so you can claim your full credit.' }
        ],
        related: ['income', 'bookkeeping', 'audit-support']
    },
    'bookkeeping': {
        slug: 'bookkeeping',
        page: 'bookkeeping.html',
        heroClass: 'hero-bookkeeping',
        heroImage: 'assets/images/hero-bookkeeping.jpg',
        image: 'assets/images/service-bookkeeping.jpg',
        title: 'Bookkeeping',
        titleFull: 'Accurate & Organized Bookkeeping',
        price: '$149',
        pricingDesc: 'Monthly or quarterly bookkeeping for small businesses, startups, and self-employed professionals.',
        desc: 'Keep your financials crystal clear with our professional bookkeeping services. We manage your bank reconciliations, accounts payable/receivable, and setup cloud accounting software.',
        descSecondary: 'Our dedicated bookkeepers ensure every transaction is categorized properly, giving you up-to-date financial statements so you always know where your business stands.',
        benefits: [
            { icon: 'bi-check2-circle', title: 'Real-Time Reconciliation', text: 'Daily and weekly bank transaction updates without delay.' },
            { icon: 'bi-cloud-arrow-up', title: 'Cloud Accounting Setup', text: 'Seamless integration with QuickBooks, Xero, and modern platforms.' },
            { icon: 'bi-cash-coin', title: 'Cash Flow Oversight', text: 'Clear insights into expenses, accounts payable, and receivable.' },
            { icon: 'bi-file-earmark-spreadsheet', title: 'Tax-Ready Statements', text: 'P&L and balance sheets ready for effortless tax filing.' }
        ],
        faqs: [
            { q: 'What accounting software do you support?', a: 'We work with QuickBooks Online, Xero, FreshBooks, Wave, and custom spreadsheet systems.' },
            { q: 'How frequently do you reconcile my accounts?', a: 'Depending on your plan, we perform reconciliations weekly, monthly, or on a customized schedule.' },
            { q: 'Can you help catch up on backlogged bookkeeping?', a: 'Yes! We offer historical catch-up services to bring messy records up to date quickly and accurately.' }
        ],
        related: ['payroll', 'reporting', 'business-tax-planning']
    },
    'payroll': {
        slug: 'payroll',
        page: 'payroll-accounting.html',
        heroClass: 'hero-payroll-accounting',
        heroImage: 'assets/images/hero-payroll-accounting.jpg',
        image: 'assets/images/service-payroll-accounting.jpg',
        title: 'Payroll Accounting',
        titleFull: 'Automated Payroll & Compliance Solutions',
        price: '$129',
        pricingDesc: 'Reliable, automated payroll with tax withholdings, direct deposits, and compliance filing.',
        desc: 'Simplify your payroll process. We handle direct deposits, accurate tax withholdings, and end-of-year W-2 and 1099 generation so you can focus on running your business.',
        descSecondary: 'Our payroll systems keep you completely compliant with federal, state, and local labor and tax guidelines while ensuring employees are paid accurately on time.',
        benefits: [
            { icon: 'bi-wallet2', title: 'Direct Deposit', text: 'Timely and secure direct deposit processing every pay period.' },
            { icon: 'bi-file-earmark-person', title: 'W-2 & 1099 Filings', text: 'Annual tax documents prepared, distributed, and submitted.' },
            { icon: 'bi-calculator', title: 'Automated Withholding', text: 'State, federal, and local taxes calculated automatically.' },
            { icon: 'bi-shield-check', title: 'Compliance Guarantee', text: 'Never worry about payroll filing penalties or audits.' }
        ],
        faqs: [
            { q: 'How quickly can you set up our company payroll?', a: 'We typically have new clients onboarded and ready for their first pay cycle within 48 to 72 hours.' },
            { q: 'Can you handle both W-2 employees and 1099 contractors?', a: 'Yes, our payroll system seamlessly handles both full-time employees and independent contractors.' },
            { q: 'Are direct deposits included in the base fee?', a: 'Yes, direct deposit for all employees is fully included.' }
        ],
        related: ['bookkeeping', 'income', 'reporting']
    },
    'audit-support': {
        slug: 'audit-support',
        page: 'audit-support.html',
        heroClass: 'hero-audit-support',
        heroImage: 'assets/images/hero-audit-support.jpg',
        image: 'assets/images/service-audit-support.jpg',
        title: 'Audit Support',
        titleFull: 'Professional Audit Representation & Defense',
        price: '$199',
        pricingDesc: 'Comprehensive defense and support before tax authorities with certified CPA representation.',
        desc: 'Facing a tax audit can be stressful. Our certified professionals provide complete representation and support, handling all communication and document preparation.',
        descSecondary: 'From answering IRS or state department inquiries to attending hearings on your behalf, we protect your rights and fight for penalty abatements and favorable resolutions.',
        benefits: [
            { icon: 'bi-person-badge', title: 'Certified Representation', text: 'Licensed CPAs and Enrolled Agents handle all agency interactions.' },
            { icon: 'bi-shield-slash', title: 'Penalty Abatement', text: 'We identify grounds to minimize or eliminate unwarranted penalties.' },
            { icon: 'bi-folder-check', title: 'Audit Trail Preparation', text: 'We organize receipts, invoices, and ledgers into an airtight dossier.' },
            { icon: 'bi-headset', title: 'Direct Correspondence', text: 'You never have to speak to the tax authorities alone.' }
        ],
        faqs: [
            { q: 'What should I do if I receive an IRS audit letter?', a: 'Do not panic. Contact our audit defense team immediately before responding or sending any documents to ensure your rights are protected.' },
            { q: 'Can you represent me if someone else prepared my taxes?', a: 'Yes! We represent clients regardless of who prepared the initial return.' },
            { q: 'What is penalty abatement?', a: 'Penalty abatement is a formal request to reduce or remove fines assessed by the tax authority due to reasonable cause.' }
        ],
        related: ['notice', 'business-tax-planning', 'income']
    },
    'business-tax-planning': {
        slug: 'business-tax-planning',
        page: 'business-tax-planning.html',
        heroClass: 'hero-business-tax-planning',
        heroImage: 'assets/images/hero-business-tax-planning.jpg',
        image: 'assets/images/service-business-tax-planning.jpg',
        title: 'Business Tax Planning',
        titleFull: 'Strategic Business Tax Planning & Structuring',
        price: '$299',
        pricingDesc: 'Strategic entity optimization, deduction discovery, and quarterly planning for growing companies.',
        desc: 'Minimize your tax liabilities legally and maximize your business growth through entity structuring, year-end planning, and strategic quarterly estimates.',
        descSecondary: 'We partner with founders, LLCs, and corporations to devise proactive tax strategies that preserve cash flow and take full advantage of emerging credits and incentives.',
        benefits: [
            { icon: 'bi-briefcase', title: 'Entity Optimization', text: 'Guidance on choosing LLC, S-Corp, or C-Corp status for maximum savings.' },
            { icon: 'bi-calendar-check', title: 'Quarterly Estimates', text: 'Accurate projections to prevent underpayment penalties and cash surprises.' },
            { icon: 'bi-piggy-bank', title: 'Deduction Strategies', text: 'Uncover industry-specific deductions, depreciation, and R&D credits.' },
            { icon: 'bi-graph-up', title: 'Growth Alignment', text: 'Align your tax posture with fundraising, expansions, and investments.' }
        ],
        faqs: [
            { q: 'When is the best time to start business tax planning?', a: 'Tax planning is proactive and should be done throughout the fiscal year—not just at tax filing time in April.' },
            { q: 'Should my business elect S-Corporation status?', a: 'For many profitable small businesses, an S-Corp election can significantly reduce self-employment taxes. We analyze your numbers to determine if it is beneficial.' },
            { q: 'Do you help with quarterly estimated payments?', a: 'Yes, we calculate your estimated quarterly taxes to keep you fully compliant and avoid penalty interest.' }
        ],
        related: ['cfo', 'reporting', 'audit-support']
    },
    'reporting': {
        slug: 'reporting',
        page: 'financial-reporting.html',
        heroClass: 'hero-financial-reporting',
        heroImage: 'assets/images/hero-financial-reporting.jpg',
        image: 'assets/images/service-financial-reporting.jpg',
        title: 'Financial Reporting',
        titleFull: 'Detailed Financial Reporting & Analytics',
        price: '$179',
        pricingDesc: 'Custom management reports, P&L statements, balance sheets, and cash flow forecasts.',
        desc: 'Gain better visibility into your business performance with our detailed monthly and annual reporting, including P&L statements, balance sheets, and cash flow projections.',
        descSecondary: 'Clear, accurate reports empower founders and executives to make informed strategic decisions and maintain complete transparency for investors and lenders.',
        benefits: [
            { icon: 'bi-graph-up-arrow', title: 'P&L Statements', text: 'Understand revenue drivers and operating margins at a glance.' },
            { icon: 'bi-pie-chart', title: 'Balance Sheet Analysis', text: 'Track assets, liabilities, and shareholder equity cleanly.' },
            { icon: 'bi-speedometer2', title: 'Cash Flow Projections', text: 'Forecast cash runways and avoid working capital shortages.' },
            { icon: 'bi-bar-chart-steps', title: 'KPI Dashboards', text: 'Custom metrics tailored to your industry and growth stage.' }
        ],
        faqs: [
            { q: 'How frequently are financial reports generated?', a: 'Reports are delivered monthly, quarterly, or on a customized management schedule.' },
            { q: 'Can these reports be shared with investors or banks?', a: 'Yes, our reports are prepared according to GAAP standards and ready for lender or board review.' },
            { q: 'Do you provide a walk-through consultation of the numbers?', a: 'Yes, our accountants schedule monthly advisory calls to review your statements with you.' }
        ],
        related: ['cfo', 'bookkeeping', 'business-tax-planning']
    },
    'notice': {
        slug: 'notice',
        page: 'tax-notice-assistance.html',
        heroClass: 'hero-tax-notice-assistance',
        heroImage: 'assets/images/hero-tax-notice-assistance.jpg',
        image: 'assets/images/service-tax-notice-assistance.jpg',
        title: 'Tax Notice Assistance',
        titleFull: 'Expert Tax Notice Review & Resolution',
        price: '$149',
        pricingDesc: 'Expert assessment and official response drafting for state and federal tax notices.',
        desc: 'Receive a surprising tax letter or CP notice? Our tax defense professionals quickly diagnose the notice, verify the agency claims, and assemble a compliant response.',
        descSecondary: 'We communicate directly with taxing authorities to protect your rights, resolve disputed penalties, and negotiate favorable resolutions.',
        benefits: [
            { icon: 'bi-envelope-paper-check', title: 'Notice Diagnosis', text: 'Comprehensive line-by-line review of agency discrepancies.' },
            { icon: 'bi-pencil-square', title: 'Formal Response Drafting', text: 'Submitting evidence and legal arguments directly to the tax authority.' },
            { icon: 'bi-shield-check', title: 'Penalty Abatement', text: 'Filing reasonable cause petitions to eliminate unnecessary fines.' },
            { icon: 'bi-telephone', title: 'Direct Representation', text: 'We interact with the IRS and state auditors on your behalf.' }
        ],
        faqs: [
            { q: 'What is the first step when I receive a tax notice?', a: 'Do not ignore it or miss the response deadline. Send us a clear copy of the notice so we can immediately inspect the assessed claims.' },
            { q: 'Does receiving a notice mean I am being audited?', a: 'Not necessarily. Most notices are simple inquiries, automated math error corrections, or requests for supporting documents.' },
            { q: 'How fast can you respond to an urgent deadline?', a: 'We offer expedited 24-48 hour response filings for time-sensitive tax notices.' }
        ],
        related: ['audit-support', 'income', 'gst']
    },
    'cfo': {
        slug: 'cfo',
        page: 'virtual-cfo-services.html',
        heroClass: 'hero-virtual-cfo-services',
        heroImage: 'assets/images/hero-virtual-cfo-services.jpg',
        image: 'assets/images/service-virtual-cfo-services.jpg',
        title: 'Virtual CFO Services',
        titleFull: 'Executive Financial Leadership & Strategic Growth',
        price: '$499',
        pricingDesc: 'High-level financial strategy, cash runway forecasting, and investor advisory for scaling enterprises.',
        desc: 'Accelerate your growth with high-level financial leadership without the full-time executive cost. Our Virtual CFOs direct your financial strategy, forecasting, and capital planning.',
        descSecondary: 'From optimizing unit economics and managing investor relations to preparing for debt or equity financing, we act as an integral financial advisor to your executive team.',
        benefits: [
            { icon: 'bi-graph-up', title: 'Strategic Forecasting', text: 'Rolling 3-year financial models, scenario planning, and stress testing.' },
            { icon: 'bi-pie-chart-fill', title: 'Capital Allocation', text: 'Optimize budget distributions, vendor contracts, and cash burn rates.' },
            { icon: 'bi-person-video3', title: 'Board & Investor Decks', text: 'Compelling financial presentations tailored for stakeholders and lenders.' },
            { icon: 'bi-briefcase', title: 'M&A & Growth Advisory', text: 'Financial due diligence, valuation modeling, and fundraising support.' }
        ],
        faqs: [
            { q: 'What is the difference between a bookkeeper and a Virtual CFO?', a: 'Bookkeepers record historical financial data; a Virtual CFO looks forward to guide strategy, profitability, and financing.' },
            { q: 'How do we collaborate with our Virtual CFO?', a: 'You have weekly or bi-weekly executive strategy sessions, ongoing Slack/email access, and live cloud dashboard tracking.' },
            { q: 'Can a Virtual CFO assist with fundraising and bank loans?', a: 'Yes, we prepare pitch-ready financial models, debt packages, and participate directly in investor due diligence meetings.' }
        ],
        related: ['business-tax-planning', 'reporting', 'payroll']
    }
};

// Aliases for alternate slug routes
servicesData['audit'] = servicesData['audit-support'];
servicesData['business'] = servicesData['business-tax-planning'];
servicesData['income-tax'] = servicesData['income'];
servicesData['gst-returns'] = servicesData['gst'];
servicesData['payroll-accounting'] = servicesData['payroll'];
servicesData['financial-reporting'] = servicesData['reporting'];
servicesData['tax-notice-assistance'] = servicesData['notice'];
servicesData['virtual-cfo-services'] = servicesData['cfo'];

/**
 * Renders the service details dynamically onto the page
 * @param {string} slug - The service identifier
 */
function renderService(slug) {
    const data = servicesData[slug] || servicesData['income'];
    if (!data) return;

    // 1. Page Title
    document.title = data.title + ' - TaxCore';

    // 2. Hero & Breadcrumbs
    const heroTitle = document.getElementById('service-hero-title') || document.querySelector('.page-hero h1');
    if (heroTitle) heroTitle.textContent = data.title;

    const breadcrumbActive = document.getElementById('service-breadcrumb-active') || document.querySelector('.breadcrumb .active');
    if (breadcrumbActive) breadcrumbActive.textContent = data.title;

    // Dynamic hero background if present
    const heroSection = document.querySelector('.page-hero');
    if (heroSection && data.heroImage) {
        heroSection.style.backgroundImage = `url('${data.heroImage}')`;
    }

    // 3. Main Content Titles & Descriptions
    const titleFull = document.getElementById('service-title-full');
    if (titleFull) titleFull.textContent = data.titleFull;

    const descLead = document.getElementById('service-desc-lead');
    if (descLead) descLead.textContent = data.desc;

    const descSecondary = document.getElementById('service-desc-secondary');
    if (descSecondary) descSecondary.textContent = data.descSecondary;

    // 4. Image
    const serviceImg = document.getElementById('service-img');
    if (serviceImg && data.image) {
        serviceImg.src = data.image;
        serviceImg.alt = data.title;
    }

    // 5. Key Benefits
    const benefitsGrid = document.getElementById('service-benefits-grid');
    if (benefitsGrid && data.benefits) {
        benefitsGrid.innerHTML = data.benefits.map(b => `
            <div class="col-md-6">
                <div class="d-flex gap-3 align-items-start bg-secondary-theme p-3 rounded-3 h-100">
                    <i class="bi ${b.icon} text-primary-brand fs-4"></i>
                    <div>
                        <h6 class="fw-bold mb-1">${b.title}</h6>
                        <p class="text-secondary small mb-0">${b.text}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 6. FAQs (with functional accordion)
    const faqAccordion = document.getElementById('faqAccordion');
    if (faqAccordion && data.faqs) {
        faqAccordion.innerHTML = data.faqs.map((faq, idx) => `
            <div class="accordion-item faq-item mb-3 border rounded">
                <h2 class="accordion-header">
                    <button class="accordion-button ${idx === 0 ? '' : 'collapsed'} fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faq${idx + 1}" aria-expanded="${idx === 0 ? 'true' : 'false'}">
                        <span class="faq-question">${faq.q}</span>
                    </button>
                </h2>
                <div id="faq${idx + 1}" class="accordion-collapse collapse ${idx === 0 ? 'show' : ''}" data-bs-parent="#faqAccordion">
                    <div class="accordion-body faq-answer text-secondary">
                        ${faq.a}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 7. Pricing Sidebar Card
    const sidebarPrice = document.getElementById('sidebar-price');
    if (sidebarPrice) sidebarPrice.textContent = data.price;

    const sidebarPricingDesc = document.getElementById('sidebar-pricing-desc');
    if (sidebarPricingDesc) sidebarPricingDesc.textContent = data.pricingDesc;

    // 8. Related Services List
    const relatedList = document.getElementById('related-services-list');
    if (relatedList && data.related) {
        const isStandalone = !window.location.pathname.toLowerCase().includes('service-details');
        relatedList.innerHTML = data.related.map(relSlug => {
            const relData = servicesData[relSlug];
            if (!relData) return '';
            const isActive = relSlug === slug || relSlug === data.slug;
            const targetHref = isStandalone && relData.page ? relData.page : `service-details.html?service=${relData.slug}`;
            return `
                <a href="${targetHref}" class="related-service-link ${isActive ? 'active' : ''}" data-service="${relData.slug}">
                    <span class="related-service-arrow">→</span>
                    <span class="related-service-text">${relData.title}</span>
                </a>
            `;
        }).join('');

        // Attach SPA transition only if on service-details.html
        if (!isStandalone) {
            relatedList.querySelectorAll('.related-service-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    const targetSlug = link.getAttribute('data-service');
                    if (targetSlug && servicesData[targetSlug]) {
                        e.preventDefault();
                        window.history.pushState({ service: targetSlug }, '', `service-details.html?service=${targetSlug}`);
                        renderService(targetSlug);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });
            });
        }
    }
}

// Initial Render and Browser Navigation Handlers
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    let requestedService = urlParams.get('service');
    const path = window.location.pathname.toLowerCase();
    
    // Fallback: check filename if on dedicated service page
    if (!requestedService) {
        if (path.includes('income-tax')) requestedService = 'income';
        else if (path.includes('gst-returns')) requestedService = 'gst';
        else if (path.includes('bookkeeping')) requestedService = 'bookkeeping';
        else if (path.includes('payroll-accounting')) requestedService = 'payroll';
        else if (path.includes('audit-support')) requestedService = 'audit-support';
        else if (path.includes('business-tax-planning')) requestedService = 'business-tax-planning';
        else if (path.includes('financial-reporting')) requestedService = 'reporting';
        else if (path.includes('tax-notice-assistance')) requestedService = 'notice';
        else if (path.includes('virtual-cfo-services')) requestedService = 'cfo';
        else if (path.includes('service-details')) requestedService = 'income';
    }

    if (requestedService && servicesData[requestedService]) {
        renderService(requestedService);
    }

    // Handle back / forward browser buttons (popstate)
    window.addEventListener('popstate', (e) => {
        const params = new URLSearchParams(window.location.search);
        const s = params.get('service') || (e.state && e.state.service);
        if (s && servicesData[s]) {
            renderService(s);
        }
    });
});
