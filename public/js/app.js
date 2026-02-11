// ===== THEME SYSTEM =====
const ThemeManager = {
    init() {
        const saved = localStorage.getItem('theme') || 'dark';
        this.set(saved);
    },
    toggle() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        this.set(next);
        Toast.show('Theme Changed', `Switched to ${next} mode`, 'info');
    },
    set(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        // Update toggle icon
        const icon = document.querySelector('.theme-toggle-slider i');
        if (icon) {
            icon.setAttribute('data-lucide', theme === 'dark' ? 'moon' : 'sun');
            if (window.lucide) lucide.createIcons();
        }
    }
};

// ===== TOAST NOTIFICATIONS =====
const Toast = {
    container: null,

    init() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    },

    show(title, message, type = 'info', duration = 4000) {
        this.init();

        const icons = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i data-lucide="${icons[type]}" class="toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="Toast.dismiss(this.parentElement)">
                <i data-lucide="x" style="width: 16px; height: 16px;"></i>
            </button>
        `;

        this.container.appendChild(toast);
        if (window.lucide) lucide.createIcons();

        // Auto dismiss
        setTimeout(() => this.dismiss(toast), duration);

        return toast;
    },

    dismiss(toast) {
        if (!toast || toast.classList.contains('removing')) return;
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    },

    success(title, message) { return this.show(title, message, 'success'); },
    error(title, message) { return this.show(title, message, 'error'); },
    warning(title, message) { return this.show(title, message, 'warning'); },
    info(title, message) { return this.show(title, message, 'info'); }
};

// ===== ANIMATED COUNTER =====
const AnimatedCounter = {
    animate(element, target, duration = 1000, prefix = '', suffix = '') {
        const start = 0;
        const startTime = performance.now();

        element.classList.add('counting');

        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out quad
            const easeProgress = 1 - (1 - progress) * (1 - progress);
            const current = start + (target - start) * easeProgress;

            element.textContent = prefix + current.toFixed(2) + suffix;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.classList.remove('counting');
            }
        };

        requestAnimationFrame(update);
    }
};

// ===== CONFETTI EFFECT =====
const Confetti = {
    colors: ['#6366f1', '#8b5cf6', '#a855f7', '#10b981', '#f59e0b', '#ef4444'],

    launch(x, y, count = 50) {
        for (let i = 0; i < count; i++) {
            this.createParticle(x, y);
        }
    },

    createParticle(x, y) {
        const particle = document.createElement('div');
        particle.className = 'confetti';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.background = this.colors[Math.floor(Math.random() * this.colors.length)];
        particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';

        // Random trajectory
        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 100;
        const vx = Math.cos(angle) * velocity;
        particle.style.setProperty('--vx', vx + 'px');

        document.body.appendChild(particle);

        setTimeout(() => particle.remove(), 3000);
    },

    celebrate() {
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 3;
        this.launch(x, y, 80);
    }
};

// ===== FLOATING ACTION BUTTON =====
const FAB = {
    isOpen: false,

    toggle() {
        this.isOpen = !this.isOpen;
        const container = document.querySelector('.fab-container');
        const fab = document.querySelector('.fab');

        if (container) container.classList.toggle('open', this.isOpen);
        if (fab) fab.classList.toggle('open', this.isOpen);
    },

    close() {
        this.isOpen = false;
        const container = document.querySelector('.fab-container');
        const fab = document.querySelector('.fab');

        if (container) container.classList.remove('open');
        if (fab) fab.classList.remove('open');
    }
};

// ===== LOADING STATES =====
const LoadingState = {
    showSkeleton(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="skeleton-container">
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton-grid">
                    <div class="skeleton skeleton-stat"></div>
                    <div class="skeleton skeleton-stat"></div>
                    <div class="skeleton skeleton-stat"></div>
                </div>
                <div class="skeleton skeleton-chart"></div>
                <div class="skeleton-list">
                    <div class="skeleton skeleton-item"></div>
                    <div class="skeleton skeleton-item"></div>
                    <div class="skeleton skeleton-item"></div>
                </div>
            </div>
        `;
    },

    hide(containerId) {
        const skeleton = document.querySelector(`#${containerId} .skeleton-container`);
        if (skeleton) skeleton.remove();
    }
};

// ===== CONFIRM DIALOG =====
const ConfirmDialog = {
    show(options) {
        return new Promise((resolve) => {
            const { title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' } = options;

            const icons = {
                warning: 'alert-triangle',
                danger: 'trash-2',
                info: 'info'
            };

            const modal = document.createElement('div');
            modal.className = 'modal confirm-dialog';
            modal.style.display = 'flex';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px; text-align: center;">
                    <div class="confirm-icon ${type}">
                        <i data-lucide="${icons[type] || 'alert-circle'}"></i>
                    </div>
                    <h2 style="margin: 1rem 0 0.5rem;">${title}</h2>
                    <p style="color: var(--text-muted); margin-bottom: 1.5rem;">${message}</p>
                    <div style="display: flex; gap: 1rem;">
                        <button class="btn-secondary" style="flex: 1;" id="confirm-cancel">${cancelText}</button>
                        <button class="btn-submit ${type === 'danger' ? 'btn-danger' : ''}" style="flex: 1;" id="confirm-ok">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            if (window.lucide) lucide.createIcons();

            modal.querySelector('#confirm-cancel').onclick = () => {
                modal.remove();
                resolve(false);
            };

            modal.querySelector('#confirm-ok').onclick = () => {
                modal.remove();
                resolve(true);
            };

            // Close on backdrop click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.remove();
                    resolve(false);
                }
            };
        });
    },

    async confirmDelete(itemName) {
        return this.show({
            title: 'Delete ' + itemName + '?',
            message: 'This action cannot be undone. Are you sure you want to continue?',
            confirmText: 'Delete',
            cancelText: 'Keep',
            type: 'danger'
        });
    }
};

// ===== TRANSACTION FILTER =====
const TransactionFilter = {
    currentFilter: 'all',
    currentSort: 'date-desc',
    dateRange: { start: null, end: null },

    setFilter(filter) {
        this.currentFilter = filter;
        this.applyFilters();
    },

    setSort(sort) {
        this.currentSort = sort;
        this.applyFilters();
    },

    setDateRange(start, end) {
        this.dateRange = { start, end };
        this.applyFilters();
    },

    applyFilters() {
        let filtered = [...allTransactions];

        // Category filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(t => t.type === this.currentFilter);
        }

        // Date range filter
        if (this.dateRange.start) {
            filtered = filtered.filter(t => new Date(t.date) >= new Date(this.dateRange.start));
        }
        if (this.dateRange.end) {
            filtered = filtered.filter(t => new Date(t.date) <= new Date(this.dateRange.end));
        }

        // Sort
        switch (this.currentSort) {
            case 'date-desc':
                filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'date-asc':
                filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'amount-desc':
                filtered.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
                break;
            case 'amount-asc':
                filtered.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
                break;
        }

        this.renderFilteredTransactions(filtered);
    },

    renderFilteredTransactions(transactions) {
        const list = document.getElementById('transactions-list');
        if (!list) return;

        if (transactions.length === 0) {
            list.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-muted);">No transactions match your filters.</p>';
            return;
        }

        list.innerHTML = transactions.slice(0, 20).map((t, index) => `
            <div class="transaction-item" style="animation: slideIn 0.3s ease forwards ${index * 0.03}s; opacity: 0;">
                <div class="transaction-icon">
                    <i data-lucide="${t.icon || 'circle-dollar-sign'}"></i>
                </div>
                <div class="transaction-info">
                    <div class="transaction-title">${t.title}</div>
                    <div class="transaction-date">${t.date}</div>
                </div>
                <div class="transaction-amount ${t.amount > 0 ? 'amount-positive' : ''}">
                    ${t.amount > 0 ? '+' : ''}${t.amount.toFixed(2)}
                </div>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();
    }
};

// ===== TRANSACTION SEARCH =====
const TransactionSearch = {
    searchTerm: '',

    filter(transactions, term) {
        if (!term) return transactions;
        const lowerTerm = term.toLowerCase();
        return transactions.filter(t =>
            t.title.toLowerCase().includes(lowerTerm) ||
            t.type.toLowerCase().includes(lowerTerm) ||
            String(t.amount).includes(lowerTerm)
        );
    },

    highlight(text, term) {
        if (!term) return text;
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
};

// ===== KEYBOARD SHORTCUTS =====
const KeyboardShortcuts = {
    init() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K = Search focus
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('.search-input');
                if (searchInput) searchInput.focus();
            }

            // Escape = Close modals/FAB
            if (e.key === 'Escape') {
                FAB.close();
                closeModal();
                closeCardModal();
                closePaymentModal();
                GuidedTour.stop();
            }

            // T = Toggle theme
            if (e.key === 't' && !e.target.matches('input, textarea')) {
                ThemeManager.toggle();
            }

            // N = New transaction (when not in input)
            if (e.key === 'n' && !e.target.matches('input, textarea')) {
                openModal();
            }

            // D = Demo mode toggle
            if (e.key === 'd' && !e.target.matches('input, textarea')) {
                DemoMode.toggle();
            }

            // R = Refresh data
            if (e.key === 'r' && !e.target.matches('input, textarea')) {
                AutoRefresh.refreshNow();
            }

            // E = Export data
            if (e.key === 'e' && !e.target.matches('input, textarea')) {
                DataExport.showModal();
            }

            // G = Start guided tour
            if (e.key === 'g' && !e.target.matches('input, textarea')) {
                GuidedTour.start();
            }

            // ? = Show keyboard shortcuts
            if (e.key === '?' && !e.target.matches('input, textarea')) {
                KeyboardShortcuts.showHelp();
            }
        });
    },

    showHelp() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'shortcuts-modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <h2 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="keyboard" style="width: 24px; height: 24px;"></i>
                    Keyboard Shortcuts
                </h2>
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.75rem 1.5rem;">
                    <kbd style="background: var(--bg-secondary); padding: 4px 10px; border-radius: 6px; font-family: monospace;">N</kbd>
                    <span>New Transaction</span>
                    <kbd style="background: var(--bg-secondary); padding: 4px 10px; border-radius: 6px; font-family: monospace;">T</kbd>
                    <span>Toggle Theme</span>
                    <kbd style="background: var(--bg-secondary); padding: 4px 10px; border-radius: 6px; font-family: monospace;">D</kbd>
                    <span>Demo Mode Toggle</span>
                    <kbd style="background: var(--bg-secondary); padding: 4px 10px; border-radius: 6px; font-family: monospace;">R</kbd>
                    <span>Refresh Data</span>
                    <kbd style="background: var(--bg-secondary); padding: 4px 10px; border-radius: 6px; font-family: monospace;">E</kbd>
                    <span>Export Data</span>
                    <kbd style="background: var(--bg-secondary); padding: 4px 10px; border-radius: 6px; font-family: monospace;">G</kbd>
                    <span>Start Guided Tour</span>
                    <kbd style="background: var(--bg-secondary); padding: 4px 10px; border-radius: 6px; font-family: monospace;">?</kbd>
                    <span>Show This Help</span>
                    <kbd style="background: var(--bg-secondary); padding: 4px 10px; border-radius: 6px; font-family: monospace;">Esc</kbd>
                    <span>Close Modals</span>
                </div>
                <button class="btn-submit" style="width: 100%; margin-top: 1.5rem;" onclick="this.closest('.modal').remove()">Got it!</button>
            </div>
        `;
        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
    }
};

// ===== DEMO MODE =====
const DemoMode = {
    isActive: false,

    sampleCards: [
        { holderName: 'Personal Visa', lastFour: '0366', expiry: '12/27', brand: 'visa', currency: 'USD', balance: 5234.50 },
        { holderName: 'Business Mastercard', lastFour: '9903', expiry: '08/26', brand: 'mastercard', currency: 'USD', balance: 2150.75 },
        { holderName: 'Travel Amex', lastFour: '0005', expiry: '03/28', brand: 'amex', currency: 'USD', balance: 12500.00 }
    ],

    sampleTransactions: [
        { title: 'Amazon Prime', amount: -14.99, type: 'subscription', icon: 'film' },
        { title: 'Whole Foods', amount: -87.32, type: 'grocery', icon: 'shopping-cart' },
        { title: 'Uber', amount: -24.50, type: 'transport', icon: 'car' },
        { title: 'Netflix', amount: -15.99, type: 'subscription', icon: 'film' },
        { title: 'Gas Station', amount: -45.00, type: 'transport', icon: 'car' },
        { title: 'Salary Deposit', amount: 5200.00, type: 'income', icon: 'arrow-down-left' },
        { title: 'Apple Store', amount: -299.00, type: 'shopping', icon: 'shopping-bag' },
        { title: 'Starbucks', amount: -6.75, type: 'shopping', icon: 'shopping-bag' },
        { title: 'Electric Bill', amount: -125.40, type: 'subscription', icon: 'film' },
        { title: 'Target', amount: -156.78, type: 'shopping', icon: 'shopping-bag' },
        { title: 'Spotify', amount: -9.99, type: 'subscription', icon: 'film' },
        { title: 'Shell Gas', amount: -52.30, type: 'transport', icon: 'car' },
        { title: 'Freelance Payment', amount: 850.00, type: 'income', icon: 'arrow-down-left' },
        { title: 'Restaurant', amount: -67.50, type: 'shopping', icon: 'shopping-bag' },
        { title: 'Gym Membership', amount: -49.99, type: 'subscription', icon: 'film' }
    ],

    async toggle() {
        if (this.isActive) {
            await this.deactivate();
        } else {
            await this.activate();
        }
    },

    async activate() {
        Toast.info('Demo Mode', 'Loading sample data...');

        try {
            // Add sample cards
            for (const card of this.sampleCards) {
                await api.addCard(card);
            }

            // Get the first card to link transactions
            const cards = await api.getAllCards();
            if (cards.length > 0) {
                // Add sample transactions with varied dates
                for (let i = 0; i < this.sampleTransactions.length; i++) {
                    const t = this.sampleTransactions[i];
                    const daysAgo = Math.floor(i / 2);
                    const date = new Date();
                    date.setDate(date.getDate() - daysAgo);

                    await api.addTransaction({
                        ...t,
                        date: date.toISOString().split('T')[0],
                        cardId: cards[i % cards.length].id
                    });
                }
            }

            this.isActive = true;
            localStorage.setItem('demoMode', 'true');
            Toast.success('Demo Mode Active', 'Sample data has been loaded!');
            Confetti.celebrate();
            manuallySelectedCardIndex = null;
            renderDashboard();
        } catch (err) {
            console.error('Demo mode error:', err);
            Toast.error('Error', 'Failed to load demo data');
        }
    },

    async deactivate() {
        Toast.info('Demo Mode', 'Clearing demo data...');

        try {
            // Delete all cards (which will cascade to transactions)
            const cards = await api.getAllCards();
            for (const card of cards) {
                await api.deleteCard(card.id);
            }

            this.isActive = false;
            localStorage.removeItem('demoMode');
            Toast.success('Demo Mode Disabled', 'All demo data has been cleared');
            manuallySelectedCardIndex = null;
            renderDashboard();
        } catch (err) {
            console.error('Demo deactivate error:', err);
            Toast.error('Error', 'Failed to clear demo data');
        }
    }
};

// ===== AUTO REFRESH =====
const AutoRefresh = {
    intervalId: null,
    interval: 300000, // 5 minutes (was 30 seconds - too frequent)
    isEnabled: true,
    lastRefresh: null,

    start() {
        if (this.intervalId) return;

        this.intervalId = setInterval(() => {
            if (document.visibilityState === 'visible' && this.isEnabled) {
                this.refreshNow(true);
            }
        }, this.interval);

        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.isEnabled) {
                this.refreshNow(true);
            }
        });
    },

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    toggle() {
        this.isEnabled = !this.isEnabled;
        Toast.info('Auto-Refresh', this.isEnabled ? 'Enabled' : 'Disabled');
        this.updateIndicator();
    },

    async refreshNow(silent = false) {
        if (!silent) {
            Toast.info('Refreshing', 'Updating data...');
        }

        // Only show sync indicator for manual refreshes
        const syncIcon = document.getElementById('sync-indicator');
        if (syncIcon && !silent) {
            syncIcon.classList.add('syncing');
        }

        await renderDashboard();
        this.lastRefresh = new Date();

        if (syncIcon && !silent) {
            syncIcon.classList.remove('syncing');
        }

        if (!silent) {
            Toast.success('Refreshed', 'Data is up to date');
        }

        this.updateIndicator();
    },

    updateIndicator() {
        const indicator = document.getElementById('last-sync-time');
        if (indicator && this.lastRefresh) {
            indicator.textContent = this.lastRefresh.toLocaleTimeString();
        }
    }
};

// ===== DATA EXPORT =====
const DataExport = {
    showModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'export-modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <h2 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="download" style="width: 24px; height: 24px;"></i>
                    Export Data
                </h2>
                <div style="display: grid; gap: 1rem;">
                    <button class="action-btn" onclick="DataExport.toCSV()" style="padding: 1rem; justify-content: center;">
                        <i data-lucide="file-spreadsheet" style="width: 20px; height: 20px;"></i>
                        <span>Export Transactions (CSV)</span>
                    </button>
                    <button class="action-btn" onclick="DataExport.toJSON()" style="padding: 1rem; justify-content: center;">
                        <i data-lucide="file-json" style="width: 20px; height: 20px;"></i>
                        <span>Full Backup (JSON)</span>
                    </button>
                    <button class="action-btn" onclick="DataExport.toPDF()" style="padding: 1rem; justify-content: center;">
                        <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
                        <span>Monthly Report (Print)</span>
                    </button>
                </div>
                <button class="btn-secondary" style="width: 100%; margin-top: 1.5rem;" onclick="this.closest('.modal').remove()">Cancel</button>
            </div>
        `;
        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
    },

    async toCSV() {
        const transactions = await api.getTransactions();

        const headers = ['Date', 'Title', 'Amount', 'Type'];
        const rows = transactions.map(t => [
            t.date,
            `"${t.title}"`,
            t.amount.toFixed(2),
            t.type
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        this.download(csv, 'transactions.csv', 'text/csv');

        document.getElementById('export-modal')?.remove();
        Toast.success('Exported', 'Transactions downloaded as CSV');
    },

    async toJSON() {
        const cards = await api.getAllCards();
        const transactions = await api.getTransactions();
        const payments = await api.getPayments();

        const backup = {
            exportDate: new Date().toISOString(),
            cards: cards,
            transactions: transactions,
            payments: payments
        };

        this.download(JSON.stringify(backup, null, 2), 'backup.json', 'application/json');

        document.getElementById('export-modal')?.remove();
        Toast.success('Exported', 'Full backup downloaded as JSON');
    },

    toPDF() {
        document.getElementById('export-modal')?.remove();
        window.print();
        Toast.info('Print', 'Use your browser print dialog to save as PDF');
    },

    download(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
};

// ===== SMART ALERTS =====
const SmartAlerts = {
    budgetLimit: 2000, // Default monthly budget
    unusualThreshold: 500, // Flag transactions over this amount

    async check() {
        const transactions = await api.getTransactions();
        const monthSpending = Analytics.calculateMonthSpending(transactions);

        // Budget warning
        if (monthSpending > this.budgetLimit * 0.8) {
            const percent = Math.round((monthSpending / this.budgetLimit) * 100);
            Toast.warning('Budget Alert', `You've spent ${percent}% of your monthly budget!`);
        }

        // Unusual activity check
        const recent = transactions.slice(0, 5);
        const unusual = recent.filter(t => Math.abs(t.amount) > this.unusualThreshold);
        if (unusual.length > 0) {
            Toast.warning('Large Transaction', `${unusual[0].title}: $${Math.abs(unusual[0].amount).toFixed(2)}`);
        }
    },

    setBudget(amount) {
        this.budgetLimit = amount;
        localStorage.setItem('budgetLimit', amount);
        Toast.success('Budget Set', `Monthly budget: $${amount}`);
    },

    loadSettings() {
        const saved = localStorage.getItem('budgetLimit');
        if (saved) this.budgetLimit = parseFloat(saved);
    }
};

// ===== GUIDED TOUR =====
const GuidedTour = {
    currentStep: 0,
    overlay: null,
    isActive: false,

    steps: [
        { selector: '.credit-card', title: '💳 Your Cards', message: 'View and manage your credit cards. Click to edit details, use arrows to switch between cards.' },
        { selector: '.stat-card:first-child', title: '📊 Quick Stats', message: 'See your spending at a glance - today, this week, and monthly totals.' },
        { selector: '.chart-container:first-of-type', title: '📈 Analytics', message: 'Visual breakdown of your spending by category and trends over time.' },
        { selector: '.badge-grid', title: '🏆 Achievements', message: 'Earn badges for smart spending habits and reaching savings goals!' },
        { selector: '.quick-actions', title: '⚡ Quick Actions', message: 'Send payments, add transactions, or add new cards with one click. The + button at bottom-right also gives quick access!' }
    ],

    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.currentStep = 0;
        document.body.classList.add('tour-active');
        this.createOverlay();
        this.showStep();
        Toast.info('Guided Tour', 'Press ESC to exit tour anytime');
    },

    stop() {
        if (!this.isActive) return;
        this.isActive = false;
        document.body.classList.remove('tour-active');
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    },

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'tour-overlay';
        this.overlay.innerHTML = `
            <div class="tour-tooltip">
                <div class="tour-title"></div>
                <div class="tour-message"></div>
                <div class="tour-controls">
                    <span class="tour-progress"></span>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="tour-btn" onclick="GuidedTour.prev()">← Back</button>
                        <button class="tour-btn tour-btn-primary" onclick="GuidedTour.next()">Next →</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.overlay);
    },

    showStep() {
        const step = this.steps[this.currentStep];
        const target = document.querySelector(step.selector);

        // Remove previous highlights
        document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));

        if (target) {
            target.classList.add('tour-highlight');
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Update tooltip content
        this.overlay.querySelector('.tour-title').textContent = step.title;
        this.overlay.querySelector('.tour-message').textContent = step.message;
        this.overlay.querySelector('.tour-progress').textContent = `${this.currentStep + 1} of ${this.steps.length}`;

        // Tooltip is fixed at bottom center via CSS - no manual positioning needed
    },

    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.showStep();
        } else {
            this.stop();
            Toast.success('Tour Complete!', 'You\'re all set to use Card Tracker!');
            Confetti.celebrate();
        }
    },

    prev() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep();
        }
    }
};

// ===== SMART INSIGHTS =====
const SmartInsights = {
    generate(transactions) {
        const insights = [];

        // Top spending category
        const categories = {};
        transactions.filter(t => t.amount < 0).forEach(t => {
            categories[t.type] = (categories[t.type] || 0) + Math.abs(t.amount);
        });

        const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
        if (topCategory) {
            insights.push({
                icon: 'trending-up',
                title: 'Top Category',
                message: `${topCategory[0].charAt(0).toUpperCase() + topCategory[0].slice(1)}: $${topCategory[1].toFixed(2)} this month`
            });
        }

        // Spending trend
        const thisWeek = Analytics.calculateWeekSpending(transactions);
        const avgDaily = thisWeek / 7;
        if (avgDaily > 100) {
            insights.push({
                icon: 'alert-circle',
                title: 'High Spending',
                message: `Averaging $${avgDaily.toFixed(0)}/day this week`
            });
        } else {
            insights.push({
                icon: 'check-circle',
                title: 'On Track',
                message: `Averaging $${avgDaily.toFixed(0)}/day - looking good!`
            });
        }

        // Savings tip
        const subscriptions = transactions.filter(t => t.type === 'subscription');
        const subTotal = subscriptions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        if (subTotal > 50) {
            insights.push({
                icon: 'lightbulb',
                title: 'Savings Tip',
                message: `$${subTotal.toFixed(0)} in subscriptions. Review unused services!`
            });
        }

        return insights;
    }
};

// ===== CARD VALIDATION =====
const validateCard = {
    luhn: (cardNumber) => {
        const digits = cardNumber.replace(/\D/g, '');
        if (digits.length < 13 || digits.length > 19) return false;
        let sum = 0;
        let isEven = false;
        for (let i = digits.length - 1; i >= 0; i--) {
            let digit = parseInt(digits[i], 10);
            if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            isEven = !isEven;
        }
        return sum % 10 === 0;
    },
    getType: (cardNumber) => {
        const digits = cardNumber.replace(/\D/g, '');
        if (/^4/.test(digits)) return 'visa';
        if (/^5[1-5]/.test(digits)) return 'mastercard';
        if (/^3[47]/.test(digits)) return 'amex';
        if (/^6(?:011|5)/.test(digits)) return 'discover';
        return 'unknown';
    },
    format: (cardNumber) => {
        const digits = cardNumber.replace(/\D/g, '');
        const groups = digits.match(/.{1,4}/g) || [];
        return groups.join(' ');
    },
    mask: (cardNumber) => {
        const digits = cardNumber.replace(/\D/g, '');
        if (digits.length < 4) return cardNumber;
        const last4 = digits.slice(-4);
        return '**** **** **** ' + last4;
    }
};

// ===== API SERVICE =====

// CSRF Token management
let csrfToken = null;
async function getCsrfToken() {
    if (!csrfToken) {
        // Check if login saved a fresh token in sessionStorage
        const stored = sessionStorage.getItem('csrfToken');
        if (stored) {
            csrfToken = stored;
            sessionStorage.removeItem('csrfToken'); // Use once, then rely on cache
        } else {
            try {
                const res = await fetch('/api/csrf-token');
                const data = await res.json();
                csrfToken = data.csrfToken;
            } catch (e) {
                console.warn('Failed to fetch CSRF token:', e);
            }
        }
    }
    return csrfToken;
}

// Secure fetch wrapper that auto-includes CSRF token
async function secureFetch(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
        const token = await getCsrfToken();
        options.headers = {
            ...options.headers,
            'X-CSRF-Token': token
        };
    }
    return fetch(url, options);
}

const api = {
    getCardDetails: async () => {
        const response = await fetch('/api/card');
        if (response.status === 401) {
            window.location.href = '/';
            return null;
        }
        if (response.status === 404) return null;
        return await response.json();
    },
    getAllCards: async () => {
        const response = await fetch('/api/cards');
        if (!response.ok) {
            console.error('Failed to fetch cards:', response.status);
            return [];
        }
        const data = await response.json();
        console.log('All cards fetched:', data);
        return Array.isArray(data) ? data : [];
    },
    getTransactions: async () => {
        const response = await fetch('/api/transactions');
        return await response.json();
    },
    getPayments: async () => {
        const response = await fetch('/api/payments');
        return await response.json();
    },
    getAnalytics: async () => {
        const response = await fetch('/api/analytics');
        return await response.json();
    },
    addTransaction: async (transaction) => {
        const response = await secureFetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction)
        });
        return await response.json();
    },
    updateCard: async (cardData) => {
        const response = await secureFetch('/api/card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cardData)
        });
        return await response.json();
    },
    addCard: async (cardData) => {
        const response = await secureFetch('/api/cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cardData)
        });
        return await response.json();
    },
    addPayment: async (payment) => {
        const response = await secureFetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payment)
        });
        return await response.json();
    },
    getCurrentUser: async () => {
        const response = await fetch('/api/me');
        if (response.ok) return await response.json();
        return null;
    },
    logout: async () => {
        await secureFetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    },
    deleteCard: async (cardId) => {
        const response = await secureFetch(`/api/cards/${cardId}`, {
            method: 'DELETE'
        });
        return await response.json();
    },
    setDefaultCard: async (cardId) => {
        const response = await secureFetch('/api/cards/default', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardId })
        });
        return await response.json();
    },
    getRecurring: async () => {
        const response = await fetch('/api/recurring');
        if (!response.ok) return [];
        return await response.json();
    },
    addRecurring: async (data) => {
        const response = await secureFetch('/api/recurring', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    },
    deleteRecurring: async (id) => {
        const response = await secureFetch(`/api/recurring/${id}`, { method: 'DELETE' });
        return await response.json();
    },
    getBudgets: async () => {
        const response = await fetch('/api/budgets');
        if (!response.ok) return [];
        return await response.json();
    },
    setBudget: async (data) => {
        const response = await secureFetch('/api/budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    },
    sendMoney: async (transferData) => {
        const response = await secureFetch('/api/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transferData)
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Transfer failed');
        }
        return result;
    }
};

// ===== ANALYTICS HELPERS =====
const Analytics = {
    calculateTodaySpending(transactions) {
        const today = new Date().toISOString().split('T')[0];
        return transactions
            .filter(t => t.date === today && t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    },
    calculateWeekSpending(transactions) {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return transactions
            .filter(t => {
                const date = new Date(t.date);
                return date >= weekAgo && date <= now && t.amount < 0;
            })
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    },
    calculateMonthSpending(transactions) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return transactions
            .filter(t => {
                const date = new Date(t.date);
                return date >= monthStart && t.amount < 0;
            })
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    },
    calculateLastMonthSpending(transactions) {
        const now = new Date();
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return transactions
            .filter(t => {
                const date = new Date(t.date);
                return date >= lastMonthStart && date <= lastMonthEnd && t.amount < 0;
            })
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    },
    findBiggestExpense(transactions) {
        const expenses = transactions.filter(t => t.amount < 0);
        if (expenses.length === 0) return null;
        return expenses.reduce((max, t) => Math.abs(t.amount) > Math.abs(max.amount) ? t : max);
    },
    getCategoryBreakdown(transactions) {
        const categories = {};
        transactions.filter(t => t.amount < 0).forEach(t => {
            const cat = t.type || 'other';
            categories[cat] = (categories[cat] || 0) + Math.abs(t.amount);
        });
        return categories;
    },
    getSpendingTrend(transactions, days = 7) {
        const trends = [];
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const total = transactions
                .filter(t => t.date === dateStr && t.amount < 0)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            trends.push({
                date: dateStr,
                label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                amount: total
            });
        }
        return trends;
    },
    calculateSavingsStreak(transactions) {
        // Calculate days without spending above daily average
        const now = new Date();
        let streak = 0;
        for (let i = 0; i < 30; i++) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const daySpending = transactions
                .filter(t => t.date === dateStr && t.amount < 0)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            if (daySpending < 50) { // Under $50 is considered "good"
                streak++;
            } else {
                break;
            }
        }
        return streak;
    },
    getAchievements(transactions, balance) {
        const achievements = [];
        const monthSpending = this.calculateMonthSpending(transactions);
        const streak = this.calculateSavingsStreak(transactions);

        // Budget Master - spent less than $500 this month
        achievements.push({
            id: 'budget_master',
            name: 'Budget Master',
            icon: 'target',
            earned: monthSpending < 500
        });

        // Saver - has positive balance
        achievements.push({
            id: 'saver',
            name: 'Smart Saver',
            icon: 'piggy-bank',
            earned: balance > 1000
        });

        // Streak Champion - 7+ day streak
        achievements.push({
            id: 'streak',
            name: 'Streak Champ',
            icon: 'flame',
            earned: streak >= 7
        });

        // First Transaction
        achievements.push({
            id: 'first',
            name: 'First Steps',
            icon: 'footprints',
            earned: transactions.length > 0
        });

        return achievements;
    }
};

// ===== CHART MANAGEMENT =====
let spendingChart = null;
let categoryChart = null;

const Charts = {
    colors: {
        primary: 'rgba(99, 102, 241, 1)',
        primaryLight: 'rgba(99, 102, 241, 0.2)',
        success: 'rgba(16, 185, 129, 1)',
        warning: 'rgba(245, 158, 11, 1)',
        danger: 'rgba(239, 68, 68, 1)',
        purple: 'rgba(139, 92, 246, 1)',
        pink: 'rgba(236, 72, 153, 1)',
        cyan: 'rgba(6, 182, 212, 1)',
        categories: [
            'rgba(99, 102, 241, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(6, 182, 212, 0.8)'
        ]
    },

    createSpendingChart(trendData) {
        const ctx = document.getElementById('spending-chart');
        if (!ctx) return;

        if (spendingChart) {
            spendingChart.destroy();
        }

        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        const textColor = isDark ? '#94a3b8' : '#64748b';

        spendingChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.map(d => d.label),
                datasets: [{
                    label: 'Spending',
                    data: trendData.map(d => d.amount),
                    fill: true,
                    borderColor: this.colors.primary,
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
                        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
                        return gradient;
                    },
                    tension: 0.4,
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? 'rgba(20, 20, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                        titleColor: isDark ? '#f8fafc' : '#1e293b',
                        bodyColor: isDark ? '#94a3b8' : '#64748b',
                        borderColor: 'rgba(139, 92, 246, 0.3)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: (context) => `$${context.parsed.y.toFixed(2)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            callback: (value) => '$' + value
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    },

    createCategoryChart(categoryData) {
        const ctx = document.getElementById('category-chart');
        if (!ctx) return;

        if (categoryChart) {
            categoryChart.destroy();
        }

        const labels = Object.keys(categoryData);
        const values = Object.values(categoryData);
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
                datasets: [{
                    data: values,
                    backgroundColor: this.colors.categories.slice(0, labels.length),
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: isDark ? '#94a3b8' : '#64748b',
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? 'rgba(20, 20, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                        titleColor: isDark ? '#f8fafc' : '#1e293b',
                        bodyColor: isDark ? '#94a3b8' : '#64748b',
                        callbacks: {
                            label: (context) => `$${context.parsed.toFixed(2)}`
                        }
                    }
                }
            }
        });
    },

    updateChartsTheme() {
        // Re-render charts when theme changes
        if (spendingChart || categoryChart) {
            // Charts will be re-rendered on next dashboard render
        }
    }
};

// ===== GLOBAL VARIABLES =====
const app = document.getElementById('app');
let currentCard = null;
let currentUser = null;
let payments = [];
let allTransactions = [];

// ===== AUTH CHECK =====
(async () => {
    const result = await api.getCurrentUser();
    if (!result || !result.user) {
        window.location.href = '/';
        return;
    }
    currentUser = result.user;
    ThemeManager.init();
})();

// ===== MODAL FUNCTIONS =====
window.logout = () => api.logout();
window.toggleTheme = () => {
    ThemeManager.toggle();
    renderDashboard();
};

window.openModal = (type) => {
    const modal = document.getElementById('transaction-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('transaction-form');
    const typeSelect = form.querySelector('select[name="type"]');

    if (type === 'topup') {
        title.textContent = 'Top Up Card';
        typeSelect.value = 'income';
    } else {
        title.textContent = 'Send Money';
        typeSelect.value = 'shopping';
    }
    modal.style.display = 'flex';
};

window.closeModal = () => {
    document.getElementById('transaction-modal').style.display = 'none';
    document.getElementById('transaction-form').reset();
};

window.openBudgetModal = () => {
    document.getElementById('budget-modal').style.display = 'flex';
};

window.closeBudgetModal = () => {
    document.getElementById('budget-modal').style.display = 'none';
    document.getElementById('budget-form').reset();
};

window.openRecurringModal = () => {
    document.getElementById('recurring-modal').style.display = 'flex';
};

window.closeRecurringModal = () => {
    document.getElementById('recurring-modal').style.display = 'none';
    document.getElementById('recurring-form').reset();
};

// Send Money Modal Functions
window.openSendMoneyModal = async () => {
    const modal = document.getElementById('send-money-modal');
    const select = document.getElementById('send-money-card-select');

    // Populate card dropdown
    try {
        const cards = await api.getAllCards();
        select.innerHTML = '<option value="">Select a card...</option>';
        cards.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = `${card.holderName} (****${card.lastFour || card.number?.slice(-4) || ''}) - $${card.balance.toFixed(2)}`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Failed to load cards:', err);
    }

    modal.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
};

window.closeSendMoneyModal = () => {
    document.getElementById('send-money-modal').style.display = 'none';
    document.getElementById('send-money-form').reset();
    // Reset UPI link result
    const upiResult = document.getElementById('upi-link-result');
    if (upiResult) upiResult.style.display = 'none';
    const qrCode = document.getElementById('upi-qr-code');
    if (qrCode) qrCode.innerHTML = '';
};

// Generate UPI Payment Link
window.generateUPILink = () => {
    const upiId = document.getElementById('upi-id-input')?.value?.trim();
    const amount = document.getElementById('upi-amount-input')?.value;
    const note = document.getElementById('upi-note-input')?.value?.trim() || '';
    const recipientName = document.querySelector('#send-money-form input[name="recipientName"]')?.value?.trim();

    // Validate UPI ID
    const upiPattern = /^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+$/;
    if (!upiId || !upiPattern.test(upiId)) {
        Toast.error('Invalid UPI ID', 'Please enter a valid UPI ID (e.g., name@upi)');
        return;
    }

    // Validate amount
    if (!amount || parseFloat(amount) < 1) {
        Toast.error('Invalid Amount', 'Please enter an amount of at least ₹1');
        return;
    }

    // Build UPI deep link
    // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&tn=NOTE&cu=INR
    const params = new URLSearchParams({
        pa: upiId,
        pn: recipientName || 'Recipient',
        am: parseFloat(amount).toFixed(2),
        cu: 'INR'
    });
    if (note) params.append('tn', note);

    const upiLink = `upi://pay?${params.toString()}`;

    // Show the result section
    const resultDiv = document.getElementById('upi-link-result');
    const deepLink = document.getElementById('upi-deep-link');
    const qrCodeDiv = document.getElementById('upi-qr-code');

    if (resultDiv && deepLink) {
        deepLink.href = upiLink;
        resultDiv.style.display = 'block';

        // Generate QR code using free API
        if (qrCodeDiv) {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}`;
            qrCodeDiv.innerHTML = `<img src="${qrUrl}" alt="UPI QR Code" style="border-radius: 8px; border: 2px solid var(--border);">`;
        }

        if (window.lucide) lucide.createIcons();
        Toast.success('UPI Link Ready!', `Click the button or scan QR to pay ₹${parseFloat(amount).toFixed(2)}`);
    }
};

window.openCardModal = () => {
    const modal = document.getElementById('card-modal');
    const form = document.getElementById('card-form');

    if (currentCard) {
        form.querySelector('input[name="holderName"]').value = currentCard.holderName || '';
        form.querySelector('input[name="lastFour"]').value = currentCard.lastFour || currentCard.number?.replace(/\D/g, '').slice(-4) || '';
        form.querySelector('input[name="expiry"]').value = currentCard.expiry || '';
        form.querySelector('select[name="brand"]').value = (currentCard.brand || 'visa').toLowerCase();
        form.querySelector('select[name="currency"]').value = currentCard.currency || 'USD';
    }
    modal.style.display = 'flex';
};

window.closeCardModal = () => {
    document.getElementById('card-modal').style.display = 'none';
};

window.openNewCardModal = () => {
    document.getElementById('new-card-modal').style.display = 'flex';
};

window.closeNewCardModal = () => {
    document.getElementById('new-card-modal').style.display = 'none';
    document.getElementById('new-card-form').reset();
};

window.openPaymentModal = () => {
    document.getElementById('payment-modal').style.display = 'flex';
    document.querySelector('#payment-form input[name="date"]').value = new Date().toISOString().split('T')[0];
};

window.closePaymentModal = () => {
    document.getElementById('payment-modal').style.display = 'none';
    document.getElementById('payment-form').reset();
};

// ===== FORM HANDLERS =====
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'transaction-form') {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        let amount = parseFloat(data.amount);
        if (data.type !== 'income') amount = -amount;

        const icons = {
            shopping: 'shopping-bag',
            subscription: 'film',
            transport: 'car',
            grocery: 'shopping-cart',
            income: 'arrow-down-left'
        };

        const transaction = {
            title: data.title,
            amount: amount,
            date: data.date,
            type: data.type,
            icon: icons[data.type] || 'circle-dollar-sign',
            cardId: currentCard?.id
        };

        try {
            await api.addTransaction(transaction);
            closeModal();
            Toast.success('Transaction Added', `${data.title} - $${Math.abs(amount).toFixed(2)}`);
            renderDashboard();
        } catch (err) {
            console.error('Error adding transaction:', err);
            Toast.error('Error', 'Failed to add transaction. Please try again.');
        }
    } else if (e.target.id === 'card-form') {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Validate last 4 digits
        if (!data.lastFour || !/^\d{4}$/.test(data.lastFour)) {
            Toast.error('Invalid Input', 'Please enter exactly 4 digits.');
            return;
        }

        const updatedCard = {
            ...currentCard,
            holderName: data.holderName,
            lastFour: data.lastFour,
            expiry: data.expiry || '',
            brand: data.brand,
            currency: data.currency
        };

        try {
            await api.updateCard(updatedCard);
            closeCardModal();
            Toast.success('Card Updated', 'Your card details have been saved.');
            renderDashboard();
        } catch (err) {
            console.error('Error updating card:', err);
            Toast.error('Error', 'Failed to update card. Please try again.');
        }
    } else if (e.target.id === 'new-card-form') {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Validate last 4 digits
        if (!data.lastFour || !/^\d{4}$/.test(data.lastFour)) {
            Toast.error('Invalid Input', 'Please enter exactly 4 digits.');
            return;
        }

        const newCard = {
            holderName: data.holderName,
            lastFour: data.lastFour,
            expiry: data.expiry || '',
            brand: data.brand,
            currency: data.currency,
            balance: parseFloat(data.balance) || 0
        };

        try {
            await api.addCard(newCard);
            closeNewCardModal();
            Toast.success('Card Added', 'Your card has been added successfully!');
            Confetti.celebrate();
            manuallySelectedCardIndex = null;
            renderDashboard();
        } catch (err) {
            console.error('Error adding card:', err);
            Toast.error('Error', 'Failed to add card. Please try again.');
        }
    } else if (e.target.id === 'payment-form') {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        const payment = {
            recipient: data.recipient,
            amount: parseFloat(data.amount),
            date: data.date,
            status: 'completed',
            cardId: currentCard?.id
        };

        try {
            await api.addPayment(payment);
            closePaymentModal();
            Toast.success('Payment Sent', `$${payment.amount.toFixed(2)} sent to ${payment.recipient}`);
            renderDashboard();
        } catch (err) {
            console.error('Error adding payment:', err);
            Toast.error('Payment Failed', 'Could not process payment. Please try again.');
        }
    } else if (e.target.id === 'budget-form') {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            await api.setBudget({
                category: data.category,
                amount_limit: parseFloat(data.amount_limit),
                period: 'monthly'
            });
            closeBudgetModal();
            Toast.success('Budget Set', `Budget for ${data.category} updated`);
            renderDashboard();
        } catch (err) {
            console.error('Error setting budget:', err);
            Toast.error('Error', 'Failed to set budget');
        }
    } else if (e.target.id === 'recurring-form') {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        const getIcon = (type) => {
            const map = { subscription: 'film', utilities: 'zap', rent: 'home', income: 'arrow-down-left' };
            return map[type] || 'refresh-cw';
        };

        try {
            await api.addRecurring({
                title: data.title,
                amount: parseFloat(data.amount),
                type: data.type,
                frequency: data.frequency,
                next_due_date: data.next_due_date,
                icon: getIcon(data.type)
            });
            closeRecurringModal();
            Toast.success('Recurring Added', 'New recurring transaction scheduled');
            renderDashboard();
        } catch (err) {
            console.error('Error adding recurring:', err);
            Toast.error('Error', 'Failed to add recurring transaction');
        }
    } else if (e.target.id === 'send-money-form') {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Validate
        if (!data.cardId) {
            Toast.error('Select Card', 'Please select a card to send from');
            return;
        }
        if (!data.amount || parseFloat(data.amount) <= 0) {
            Toast.error('Invalid Amount', 'Please enter a valid amount');
            return;
        }

        try {
            const result = await api.sendMoney({
                cardId: data.cardId,
                recipientName: data.recipientName,
                recipientContact: data.recipientContact,
                amount: parseFloat(data.amount),
                note: data.note || ''
            });
            closeSendMoneyModal();
            Toast.success('Money Sent!', `$${result.amount.toFixed(2)} sent to ${result.recipient}`);
            Confetti.celebrate();
            renderDashboard();
        } catch (err) {
            console.error('Error sending money:', err);
            Toast.error('Transfer Failed', err.message || 'Could not complete transfer');
        }
    }
});

// ===== RENDER DASHBOARD =====
let allCards = []; // Store all user's cards
let selectedCardIndex = 0; // Index of currently selected card
let manuallySelectedCardIndex = null; // Track if user manually selected a card

const renderDashboard = async () => {
    try {
        // Fetch all cards for the user
        allCards = await api.getAllCards();

        console.log('renderDashboard - allCards:', allCards.length, 'manuallySelected:', manuallySelectedCardIndex);

        if (!allCards || allCards.length === 0) {
            renderOnboarding();
            return;
        }

        // If user manually selected a card, preserve that selection
        if (manuallySelectedCardIndex !== null && manuallySelectedCardIndex < allCards.length) {
            selectedCardIndex = manuallySelectedCardIndex;
        } else {
            // Otherwise use default card or first card
            const defaultCardIndex = allCards.findIndex(c => c.isDefault);
            selectedCardIndex = defaultCardIndex >= 0 ? defaultCardIndex : 0;
        }

        const card = allCards[selectedCardIndex];

        const [transactions, paymentsData, budgets, recurring] = await Promise.all([
            api.getTransactions(),
            api.getPayments(),
            api.getBudgets(),
            api.getRecurring()
        ]);

        currentCard = card;
        payments = paymentsData;
        allTransactions = transactions;
        window.currentBudgets = budgets;
        window.currentRecurring = recurring;

        // Calculate Analytics
        const todaySpending = Analytics.calculateTodaySpending(transactions);
        const weekSpending = Analytics.calculateWeekSpending(transactions);
        const monthSpending = Analytics.calculateMonthSpending(transactions);
        const lastMonthSpending = Analytics.calculateLastMonthSpending(transactions);
        const biggestExpense = Analytics.findBiggestExpense(transactions);
        const categoryBreakdown = Analytics.getCategoryBreakdown(transactions);
        const spendingTrend = Analytics.getSpendingTrend(transactions, 7);
        const savingsStreak = Analytics.calculateSavingsStreak(transactions);
        const achievements = Analytics.getAchievements(transactions, card.balance || 0);
        const smartInsights = SmartInsights.generate(transactions);

        const monthChange = lastMonthSpending > 0
            ? ((monthSpending - lastMonthSpending) / lastMonthSpending * 100).toFixed(1)
            : 0;

        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

        app.innerHTML = `
            <!-- Header -->
            <header class="header-main">
                <div class="header-content">
                    <div class="header-left">
                        <h1>Dashboard</h1>
                        <p>Welcome back, ${card.holderName}</p>
                    </div>
                    <div class="header-actions">
                        <div class="theme-toggle" onclick="toggleTheme()" title="Toggle Theme">
                            <div class="theme-toggle-slider">
                                <i data-lucide="${currentTheme === 'dark' ? 'moon' : 'sun'}"></i>
                            </div>
                        </div>
                        <div class="sync-indicator" id="sync-indicator" title="Auto-refresh active">
                            <i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i>
                            <span id="last-sync-time">--:--</span>
                        </div>

                        <!-- Notification Bell -->
                        <div class="notif-wrapper" style="position: relative;">
                            <button class="header-btn" onclick="toggleNotifications()" title="Notifications" id="notif-bell">
                                <i data-lucide="bell"></i>
                                <span class="notif-badge" id="notif-badge">3</span>
                            </button>
                            <div class="notif-dropdown" id="notif-dropdown" style="display: none;">
                                <div class="notif-dropdown-header">
                                    <strong>Notifications</strong>
                                    <button onclick="clearNotifications()" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:0.8rem;">Clear all</button>
                                </div>
                                <div class="notif-item">
                                    <i data-lucide="alert-triangle" style="width:16px;height:16px;color:#f59e0b;flex-shrink:0;"></i>
                                    <div>
                                        <div class="notif-title">High Spending Alert</div>
                                        <div class="notif-desc">You've spent 80% of your monthly budget</div>
                                        <div class="notif-time">2 hours ago</div>
                                    </div>
                                </div>
                                <div class="notif-item">
                                    <i data-lucide="credit-card" style="width:16px;height:16px;color:#6366f1;flex-shrink:0;"></i>
                                    <div>
                                        <div class="notif-title">Payment Due Soon</div>
                                        <div class="notif-desc">Your card payment is due in 5 days</div>
                                        <div class="notif-time">1 day ago</div>
                                    </div>
                                </div>
                                <div class="notif-item">
                                    <i data-lucide="trending-up" style="width:16px;height:16px;color:#10b981;flex-shrink:0;"></i>
                                    <div>
                                        <div class="notif-title">Spending Down 15%</div>
                                        <div class="notif-desc">Great job! Your spending decreased this week</div>
                                        <div class="notif-time">3 days ago</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button class="header-btn" onclick="DemoMode.toggle()" title="Toggle Demo Mode">
                            <i data-lucide="play-circle"></i>
                        </button>
                        <button class="header-btn" onclick="DataExport.showModal()" title="Export Data">
                            <i data-lucide="download"></i>
                        </button>
                        <button class="header-btn" onclick="GuidedTour.start()" title="Start Tour">
                            <i data-lucide="help-circle"></i>
                        </button>
                        <button class="header-btn" onclick="openNewCardModal()" title="Add New Card">
                            <i data-lucide="plus"></i>
                        </button>
                        <button class="header-btn" onclick="openCardModal()" title="Edit Card">
                            <i data-lucide="credit-card"></i>
                        </button>

                        <!-- Profile Dropdown -->
                        <div class="profile-wrapper" style="position: relative;">
                            <button class="header-btn profile-avatar" onclick="toggleProfile()" title="Profile">
                                <div style="width:32px;height:32px;border-radius:50%;background:var(--gradient-main);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;color:white;">
                                    ${(card.holderName || 'U').charAt(0).toUpperCase()}
                                </div>
                            </button>
                            <div class="profile-dropdown" id="profile-dropdown" style="display:none;">
                                <div class="profile-dropdown-header">
                                    <div style="width:40px;height:40px;border-radius:50%;background:var(--gradient-main);display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:1rem;">
                                        ${(card.holderName || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style="font-weight:600;">${card.holderName || 'User'}</div>
                                        <div style="font-size:0.8rem;color:var(--text-muted);">Premium Member</div>
                                    </div>
                                </div>
                                <div class="profile-dropdown-items">
                                    <button onclick="KeyboardShortcuts.showHelp()" class="profile-menu-item">
                                        <i data-lucide="keyboard" style="width:16px;height:16px;"></i> Keyboard Shortcuts
                                    </button>
                                    <button onclick="openCardModal()" class="profile-menu-item">
                                        <i data-lucide="settings" style="width:16px;height:16px;"></i> Card Settings
                                    </button>
                                    <button onclick="ThemeManager.toggle()" class="profile-menu-item">
                                        <i data-lucide="palette" style="width:16px;height:16px;"></i> Switch Theme
                                    </button>
                                    <div style="border-top:1px solid var(--border);margin:0.25rem 0;"></div>
                                    <button onclick="logout()" class="profile-menu-item" style="color:#ef4444;">
                                        <i data-lucide="log-out" style="width:16px;height:16px;"></i> Log Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Stats Grid -->
            <div class="stats-grid">
                <div class="stat-card stagger-1">
                    <div class="stat-icon primary">
                        <i data-lucide="wallet"></i>
                    </div>
                    <div class="stat-value">${card.currency} ${(card.balance || 0).toFixed(2)}</div>
                    <div class="stat-label">Current Balance</div>
                </div>
                <div class="stat-card stagger-2">
                    <div class="stat-icon warning">
                        <i data-lucide="trending-up"></i>
                    </div>
                    <div class="stat-value">$${todaySpending.toFixed(2)}</div>
                    <div class="stat-label">Today's Spending</div>
                </div>
                <div class="stat-card stagger-3">
                    <div class="stat-icon ${parseFloat(monthChange) > 0 ? 'danger' : 'success'}">
                        <i data-lucide="calendar"></i>
                    </div>
                    <div class="stat-value">$${monthSpending.toFixed(2)}</div>
                    <div class="stat-label">This Month</div>
                    <div class="stat-trend ${parseFloat(monthChange) > 0 ? 'down' : 'up'}">
                        <i data-lucide="${parseFloat(monthChange) > 0 ? 'trending-up' : 'trending-down'}" style="width: 12px; height: 12px;"></i>
                        ${Math.abs(monthChange)}% vs last month
                    </div>
                </div>
                <div class="stat-card stagger-4">
                    <div class="stat-icon success">
                        <i data-lucide="flame"></i>
                    </div>
                    <div class="stat-value">${savingsStreak} days</div>
                    <div class="stat-label">Savings Streak</div>
                </div>
            </div>

            <!-- Insights Panel -->
            <div class="insights-panel stagger-5">
                <div class="insight-card">
                    <div class="insight-header">
                        <i data-lucide="zap"></i>
                        <span>Biggest Expense</span>
                    </div>
                    <div class="insight-value">${biggestExpense ? '$' + Math.abs(biggestExpense.amount).toFixed(2) : 'N/A'}</div>
                    <div class="insight-description">${biggestExpense ? biggestExpense.title : 'No expenses yet'}</div>
                </div>
                <div class="insight-card">
                    <div class="insight-header">
                        <i data-lucide="bar-chart-3"></i>
                        <span>Weekly Average</span>
                    </div>
                    <div class="insight-value">$${(weekSpending / 7).toFixed(2)}</div>
                    <div class="insight-description">Per day this week</div>
                </div>
                <div class="insight-card">
                    <div class="insight-header">
                        <i data-lucide="receipt"></i>
                        <span>Transactions</span>
                    </div>
                    <div class="insight-value">${transactions.length}</div>
                    <div class="insight-description">Total this month</div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="charts-grid stagger-6">
                <div class="chart-container">
                    <div class="chart-header">
                        <span class="chart-title">Spending Trend</span>
                        <div class="chart-filters">
                            <button class="chart-filter-btn active">Week</button>
                            <button class="chart-filter-btn">Month</button>
                        </div>
                    </div>
                    <div class="chart-canvas-wrapper">
                        <canvas id="spending-chart"></canvas>
                    </div>
                </div>
                <div class="chart-container">
                    <div class="chart-header">
                        <span class="chart-title">By Category</span>
                    </div>
                    <div class="chart-canvas-wrapper">
                        <canvas id="category-chart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Achievements -->
            <div class="achievements-section animate-slide-up">
                <h2 style="font-size: 1.25rem; margin-bottom: 1rem; color: var(--text-main);">Achievements</h2>
                <div class="badge-grid">
                    ${achievements.map(a => `
                        <div class="badge ${a.earned ? 'earned' : ''}">
                            <i data-lucide="${a.icon}" class="badge-icon"></i>
                            <span class="badge-text">${a.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Smart Insights -->
            ${smartInsights.length > 0 ? `
            <div class="insights-section animate-slide-up" style="margin-bottom: var(--spacing-lg);">
                <h2 style="font-size: 1.25rem; margin-bottom: 1rem; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="sparkles" style="width: 20px; height: 20px; color: var(--accent);"></i>
                    Smart Insights
                </h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
                    ${smartInsights.map(insight => `
                        <div class="insight-card">
                            <div class="insight-icon">
                                <i data-lucide="${insight.icon}" style="width: 18px; height: 18px;"></i>
                            </div>
                            <div class="insight-content">
                                <div class="insight-title">${insight.title}</div>
                                <div class="insight-message">${insight.message}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Budget Goals -->
            ${window.currentBudgets && window.currentBudgets.length > 0 ? `
            <div class="budgets-section animate-slide-up" style="margin-bottom: var(--spacing-lg);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h2 style="font-size: 1.25rem; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="target" style="width: 20px; height: 20px; color: var(--accent);"></i>
                        Budget Goals
                    </h2>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
                    ${window.currentBudgets.map(budget => {
            const spent = (categoryBreakdown[budget.category] || 0);
            const percent = Math.min(100, (spent / budget.amount_limit) * 100);
            const color = percent > 100 ? '#ef4444' : (percent > 85 ? '#f59e0b' : 'var(--accent)');
            return `
                        <div class="glass" style="padding: 1.25rem; border-radius: var(--radius-lg);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span style="font-weight: 600; text-transform: capitalize; display: flex; align-items: center; gap: 0.5rem;">
                                    ${budget.category}
                                </span>
                                <span style="font-size: 0.9rem; color: var(--text-muted);">
                                    $${spent.toFixed(0)} <span style="color: var(--text-secondary)">/ $${budget.amount_limit}</span>
                                </span>
                            </div>
                            <div style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem;">
                                <div style="width: ${percent}%; height: 100%; background: ${color}; transition: width 1s ease;"></div>
                            </div>
                            <div style="text-align: right; font-size: 0.8rem; color: ${percent > 100 ? '#ef4444' : 'var(--text-muted)'};">
                                ${percent.toFixed(0)}% used
                            </div>
                        </div>
                        `;
        }).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Recurring Transactions -->
            ${window.currentRecurring && window.currentRecurring.length > 0 ? `
            <div class="recurring-section animate-slide-up" style="margin-bottom: var(--spacing-lg);">
                <h2 style="font-size: 1.25rem; margin-bottom: 1rem; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="calendar-clock" style="width: 20px; height: 20px; color: var(--accent);"></i>
                    Recurring
                </h2>
                <div style="display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 0.5rem; scrollbar-width: thin;">
                    ${window.currentRecurring.map(rec => `
                        <div class="glass" style="min-width: 200px; padding: 1rem; border-radius: var(--radius-lg); display: flex; align-items: center; gap: 1rem;">
                            <div style="width: 40px; height: 40px; background: rgba(139, 92, 246, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--accent);">
                                <i data-lucide="${rec.icon || 'refresh-cw'}" style="width: 20px; height: 20px;"></i>
                            </div>
                            <div>
                                <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">${rec.title}</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">$${rec.amount.toFixed(2)} / ${rec.frequency}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Main Content Grid -->
            <main style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; margin-top: 2rem;">
                <!-- Card Section -->
                <section id="card-section" style="perspective: 1000px;">
                    <!-- Card Navigation -->
                    <div class="card-carousel" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                        <button class="card-nav-btn" onclick="switchCard('prev')" ${allCards.length <= 1 ? 'disabled' : ''} style="width: 40px; height: 40px; border-radius: 50%; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-main); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">
                            <i data-lucide="chevron-left" style="width: 20px; height: 20px;"></i>
                        </button>
                        <div style="flex: 1; text-align: center;">
                            <span style="color: var(--text-muted); font-size: 0.9rem;">
                                Card ${selectedCardIndex + 1} of ${allCards.length}
                                ${card.isDefault ? '<span style="color: var(--accent); margin-left: 0.5rem;">★ Default</span>' : ''}
                            </span>
                        </div>
                        <button class="card-nav-btn" onclick="switchCard('next')" ${allCards.length <= 1 ? 'disabled' : ''} style="width: 40px; height: 40px; border-radius: 50%; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-main); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">
                            <i data-lucide="chevron-right" style="width: 20px; height: 20px;"></i>
                        </button>
                    </div>
                    
                    <!-- Credit Card Display -->
                    <div class="credit-card ${(card.brand || 'unknown').toLowerCase()}" id="interactive-card" onclick="openCardModal()">
                        <div class="card-glare"></div>
                        <div class="card-top">
                            <div class="chip"></div>
                            <div style="text-align: right;">
                                <div style="font-size: 0.7rem; text-transform: uppercase; color: rgba(255,255,255,0.6);">Balance</div>
                                <div style="font-size: 1.3rem; font-weight: bold;">${card.currency} ${(card.balance || 0).toFixed(2)}</div>
                            </div>
                        </div>
                        <div class="card-number">${card.number || '**** **** **** ****'}</div>
                        <div class="card-details">
                            <div>
                                <div class="card-label">Card Holder</div>
                                <div class="card-value">${card.holderName}</div>
                            </div>
                            <div>
                                <div class="card-label">Expires</div>
                                <div class="card-value">${card.expiry || 'MM/YY'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Card Management Buttons -->
                    <div class="card-management" style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap; justify-content: center;">
                        <button class="action-btn" onclick="openNewCardModal()" style="flex: 1; min-width: 100px; padding: 0.75rem 1rem;">
                            <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
                            <span>Add Card</span>
                        </button>
                        ${!card.isDefault ? `
                        <button class="action-btn" onclick="setAsDefaultCard('${card.id}')" style="flex: 1; min-width: 100px; padding: 0.75rem 1rem;">
                            <i data-lucide="star" style="width: 16px; height: 16px;"></i>
                            <span>Set Default</span>
                        </button>` : ''}
                        ${allCards.length > 1 ? `
                        <button class="action-btn" onclick="deleteCardConfirm('${card.id}')" style="flex: 1; min-width: 100px; padding: 0.75rem 1rem; color: var(--danger);">
                            <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                            <span>Delete</span>
                        </button>` : ''}
                    </div>
                </section>


                <!-- Quick Actions & Payments -->
                <section>
                    <div style="margin-bottom: 2rem;">
                        <h2 style="font-size: 1.25rem; margin-bottom: 1rem;">Quick Actions</h2>
                        <div class="quick-actions">
                            <button class="action-btn" onclick="openSendMoneyModal()">
                                <i data-lucide="send"></i>
                                <span class="action-label">Send</span>
                            </button>
                            <button class="action-btn" onclick="openModal('topup')">
                                <i data-lucide="plus-circle"></i>
                                <span class="action-label">Top Up</span>
                            </button>
                            <button class="action-btn" onclick="openPaymentModal()">
                                <i data-lucide="receipt"></i>
                                <span class="action-label">Pay Bill</span>
                            </button>
                            <button class="action-btn" onclick="openBudgetModal()">
                                <i data-lucide="target"></i>
                                <span class="action-label">Set Budget</span>
                            </button>
                            <button class="action-btn" onclick="openRecurringModal()">
                                <i data-lucide="calendar-clock"></i>
                                <span class="action-label">Recurring</span>
                            </button>
                        </div>
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <h2 style="font-size: 1.25rem; margin-bottom: 1rem;">Payment History</h2>
                        <div class="glass" style="padding: 0.5rem; max-height: 300px; overflow-y: auto;">
                            ${payments.length > 0 ? payments.slice(0, 5).map((p, index) => `
                                <div class="transaction-item" style="animation: slideIn 0.3s ease forwards ${index * 0.1}s; opacity: 0;">
                                    <div class="transaction-icon" style="background: ${p.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)'};">
                                        <i data-lucide="${p.status === 'completed' ? 'check-circle' : 'clock'}" style="color: ${p.status === 'completed' ? '#10b981' : '#eab308'};"></i>
                                    </div>
                                    <div class="transaction-info">
                                        <div class="transaction-title">${p.recipient}</div>
                                        <div class="transaction-date">${p.date} • ${p.reference || 'Payment'}</div>
                                    </div>
                                    <div class="transaction-amount">-${p.amount.toFixed(2)}</div>
                                </div>
                            `).join('') : '<p style="text-align: center; padding: 2rem; color: var(--text-muted);">No payments yet</p>'}
                        </div>
                    </div>
                </section>
            </main>

            <!-- Recent Transactions -->
            <section id="transactions-section" style="margin-top: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                    <h2 style="font-size: 1.25rem; margin: 0;">Recent Transactions</h2>
                    <div class="search-bar" style="margin: 0; max-width: 300px; flex: 1;">
                        <input type="text" class="search-input" placeholder="Search transactions... (Ctrl+K)" id="transaction-search" onkeyup="filterTransactions(this.value)">
                        <i data-lucide="search" class="search-icon"></i>
                        <button class="search-clear" onclick="clearTransactionSearch()" type="button">
                            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Filter Bar -->
                <div class="filter-bar">
                    <button class="filter-btn active" onclick="setTransactionFilter('all', this)">All</button>
                    <button class="filter-btn" onclick="setTransactionFilter('shopping', this)">🛒 Shopping</button>
                    <button class="filter-btn" onclick="setTransactionFilter('transport', this)">🚗 Transport</button>
                    <button class="filter-btn" onclick="setTransactionFilter('food', this)">🍔 Food</button>
                    <button class="filter-btn" onclick="setTransactionFilter('subscription', this)">📱 Subscriptions</button>
                    <select class="filter-select" onchange="setTransactionSort(this.value)">
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="amount-desc">Highest Amount</option>
                        <option value="amount-asc">Lowest Amount</option>
                    </select>
                </div>
                
                <div class="glass" style="padding: 0.5rem;" id="transactions-list">
                    ${transactions.length > 0 ? transactions.slice(0, 10).map((t, index) => `
                        <div class="transaction-item" style="animation: slideIn 0.3s ease forwards ${index * 0.05}s; opacity: 0;">
                            <div class="transaction-icon">
                                <i data-lucide="${t.icon || 'circle-dollar-sign'}"></i>
                            </div>
                            <div class="transaction-info">
                                <div class="transaction-title">${t.title}</div>
                                <div class="transaction-date">${t.date}</div>
                            </div>
                            <div class="transaction-amount ${t.amount > 0 ? 'amount-positive' : ''}">
                                ${t.amount > 0 ? '+' : ''}${t.amount.toFixed(2)}
                            </div>
                        </div>
                    `).join('') : '<p style="text-align: center; padding: 2rem; color: var(--text-muted);">No transactions yet. Use the quick actions above to get started!</p>'}
                </div>
            </section>

            <!-- Floating Action Button -->
            <div class="fab-container">
                <div class="fab-menu">
                    <button class="fab-action" onclick="openModal(); FAB.close();">
                        <div class="fab-action-icon"><i data-lucide="receipt"></i></div>
                        <span class="fab-action-label">Add Transaction</span>
                    </button>
                    <button class="fab-action" onclick="openSendMoneyModal(); FAB.close();">
                        <div class="fab-action-icon"><i data-lucide="send"></i></div>
                        <span class="fab-action-label">Send Money</span>
                    </button>
                    <button class="fab-action" onclick="openNewCardModal(); FAB.close();">
                        <div class="fab-action-icon"><i data-lucide="credit-card"></i></div>
                        <span class="fab-action-label">Add Card</span>
                    </button>
                </div>
                <button class="fab pulse" onclick="FAB.toggle()" title="Quick Actions">
                    <i data-lucide="plus"></i>
                </button>
            </div>

            <!-- Mobile Bottom Navigation -->
            <nav class="bottom-nav">
                <div class="bottom-nav-items">
                    <button class="bottom-nav-item active" onclick="scrollToSection('card-section')">
                        <i data-lucide="credit-card"></i>
                        <span>Card</span>
                    </button>
                    <button class="bottom-nav-item" onclick="scrollToSection('transactions-section')">
                        <i data-lucide="list"></i>
                        <span>History</span>
                    </button>
                    <button class="bottom-nav-item" onclick="openModal()">
                        <i data-lucide="plus-circle"></i>
                        <span>Add</span>
                    </button>
                    <button class="bottom-nav-item" onclick="toggleTheme()">
                        <i data-lucide="${currentTheme === 'dark' ? 'moon' : 'sun'}"></i>
                        <span>Theme</span>
                    </button>
                    <button class="bottom-nav-item" onclick="logout()">
                        <i data-lucide="log-out"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </nav>
        `;

        if (window.lucide) window.lucide.createIcons();

        // Initialize Charts
        setTimeout(() => {
            Charts.createSpendingChart(spendingTrend);
            Charts.createCategoryChart(categoryBreakdown);
        }, 100);

        // 3D Tilt Effect
        const cardEl = document.getElementById('interactive-card');
        const glareEl = cardEl?.querySelector('.card-glare');

        if (cardEl && glareEl) {
            cardEl.addEventListener('mousemove', (e) => {
                const rect = cardEl.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;

                cardEl.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                glareEl.style.opacity = '1';
                glareEl.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.3), transparent 50%)`;
            });

            cardEl.addEventListener('mouseleave', () => {
                cardEl.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                glareEl.style.opacity = '0';
            });
        }

    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        renderOnboarding();
    }
};

const renderOnboarding = () => {
    app.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; text-align: center;">
            <div style="margin-bottom: 2rem;">
                <i data-lucide="credit-card" style="width: 80px; height: 80px; color: var(--accent);"></i>
            </div>
            <h1 style="font-size: 2.5rem; margin-bottom: 1rem; background: var(--gradient-main); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                Welcome to Card Tracker
            </h1>
            <p style="color: var(--text-muted); font-size: 1.1rem; max-width: 400px; margin-bottom: 2rem;">
                Track your credit card transactions, manage payments, and monitor your spending - all in one place.
            </p>
            <button onclick="openNewCardModal()" class="btn-submit" style="padding: 1rem 2.5rem; font-size: 1.1rem;">
                <span style="display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="plus-circle" style="width: 20px; height: 20px;"></i>
                    Add Your First Card
                </span>
            </button>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();
};

// ===== SCROLL HELPER =====
const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Update active nav item
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
    }
};

// ===== TRANSACTION SEARCH =====
window.filterTransactions = (searchTerm) => {
    const transactionsList = document.getElementById('transactions-list');
    if (!transactionsList || !allTransactions) return;

    const filtered = TransactionSearch.filter(allTransactions, searchTerm);

    if (filtered.length === 0) {
        transactionsList.innerHTML = `
            <div class="empty-state" style="padding: 2rem;">
                <i data-lucide="search-x" class="empty-state-icon" style="width: 48px; height: 48px;"></i>
                <p style="color: var(--text-muted);">No transactions found for "${searchTerm}"</p>
            </div>
        `;
    } else {
        transactionsList.innerHTML = filtered.slice(0, 15).map((t, index) => `
            <div class="transaction-item" style="animation: slideIn 0.2s ease forwards ${index * 0.03}s; opacity: 0;">
                <div class="transaction-icon">
                    <i data-lucide="${t.icon || 'circle-dollar-sign'}"></i>
                </div>
                <div class="transaction-info">
                    <div class="transaction-title">${TransactionSearch.highlight(t.title, searchTerm)}</div>
                    <div class="transaction-date">${t.date}</div>
                </div>
                <div class="transaction-amount ${t.amount > 0 ? 'amount-positive' : ''}">
                    ${t.amount > 0 ? '+' : ''}${t.amount.toFixed(2)}
                </div>
            </div>
        `).join('');
    }

    if (window.lucide) lucide.createIcons();
};

window.clearTransactionSearch = () => {
    const searchInput = document.getElementById('transaction-search');
    if (searchInput) {
        searchInput.value = '';
        filterTransactions('');
    }
};

// ===== TRANSACTION FILTER FUNCTIONS =====
window.setTransactionFilter = (filter, btn) => {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    TransactionFilter.setFilter(filter);
};

window.setTransactionSort = (sort) => {
    TransactionFilter.setSort(sort);
};

// ===== CARD MANAGEMENT FUNCTIONS =====
window.switchCard = (direction) => {
    if (allCards.length <= 1) return;

    if (direction === 'prev') {
        selectedCardIndex = selectedCardIndex > 0 ? selectedCardIndex - 1 : allCards.length - 1;
    } else {
        selectedCardIndex = selectedCardIndex < allCards.length - 1 ? selectedCardIndex + 1 : 0;
    }

    // Mark this as a manual selection so renderDashboard preserves it
    manuallySelectedCardIndex = selectedCardIndex;
    currentCard = allCards[selectedCardIndex];

    console.log('switchCard - new index:', selectedCardIndex, 'total cards:', allCards.length);

    // Re-render just the card section for smooth transition
    const cardSection = document.getElementById('card-section');
    if (cardSection) {
        cardSection.style.opacity = '0';
        cardSection.style.transform = direction === 'prev' ? 'translateX(-20px)' : 'translateX(20px)';
        setTimeout(() => {
            renderDashboard();
        }, 150);
    }
};

window.setAsDefaultCard = async (cardId) => {
    try {
        await api.setDefaultCard(cardId);
        Toast.success('Default Card Set', 'This card is now your default card');
        manuallySelectedCardIndex = null; // Reset to use the new default
        renderDashboard();
    } catch (err) {
        console.error('Error setting default card:', err);
        Toast.error('Error', 'Failed to set default card');
    }
};

window.deleteCardConfirm = (cardId) => {
    if (confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
        deleteCard(cardId);
    }
};

const deleteCard = async (cardId) => {
    try {
        await api.deleteCard(cardId);
        Toast.success('Card Deleted', 'The card has been removed');

        // Reset selectedCardIndex if needed
        if (selectedCardIndex >= allCards.length - 1) {
            selectedCardIndex = Math.max(0, allCards.length - 2);
        }
        manuallySelectedCardIndex = null; // Reset manual selection

        renderDashboard();
    } catch (err) {
        console.error('Error deleting card:', err);
        Toast.error('Error', 'Failed to delete card');
    }
};

// ===== INITIALIZE =====
ThemeManager.init();
KeyboardShortcuts.init();
SmartAlerts.loadSettings();
AutoRefresh.start();
renderDashboard();

// Check for first-time user tour
if (!localStorage.getItem('tourCompleted') && !sessionStorage.getItem('welcomed')) {
    setTimeout(() => {
        Toast.info('Welcome!', 'Press ? for shortcuts, G for guided tour, D for demo mode');
        sessionStorage.setItem('welcomed', 'true');
    }, 1500);
}

// Periodic smart alerts check
setInterval(() => {
    if (document.visibilityState === 'visible' && allCards.length > 0) {
        SmartAlerts.check();
    }
}, 300000); // Check every 5 minutes

// ===== SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker registered:', registration.scope);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// ===== PWA INSTALL PROMPT =====
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show install button after a delay
    setTimeout(() => {
        if (deferredPrompt) {
            Toast.info('Install App', 'Add Card Tracker to your home screen for quick access!', 8000);
        }
    }, 30000);
});

window.installPWA = async () => {
    if (!deferredPrompt) {
        Toast.info('Already Installed', 'Card Tracker is already installed or not supported');
        return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
        Toast.success('Installed!', 'Card Tracker has been added to your home screen');
        Confetti.celebrate();
    }

    deferredPrompt = null;
};

window.addEventListener('appinstalled', () => {
    Toast.success('App Installed', 'Card Tracker is now installed on your device!');
    deferredPrompt = null;
});

// ===== NOTIFICATION & PROFILE DROPDOWNS =====
window.toggleNotifications = () => {
    const dropdown = document.getElementById('notif-dropdown');
    const profileDD = document.getElementById('profile-dropdown');
    if (profileDD) profileDD.style.display = 'none';
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
};

window.clearNotifications = () => {
    const dropdown = document.getElementById('notif-dropdown');
    const badge = document.getElementById('notif-badge');
    const items = dropdown?.querySelectorAll('.notif-item');
    if (items) items.forEach(item => item.remove());
    if (badge) badge.style.display = 'none';

    // Add an empty state
    const header = dropdown?.querySelector('.notif-dropdown-header');
    if (header) {
        const empty = document.createElement('div');
        empty.style.cssText = 'padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;';
        empty.innerHTML = '<i data-lucide="bell-off" style="width:24px;height:24px;margin:0 auto 0.5rem;display:block;opacity:0.5;"></i>No notifications';
        header.after(empty);
        if (window.lucide) lucide.createIcons();
    }
    Toast.success('Cleared', 'All notifications cleared');
};

window.toggleProfile = () => {
    const dropdown = document.getElementById('profile-dropdown');
    const notifDD = document.getElementById('notif-dropdown');
    if (notifDD) notifDD.style.display = 'none';
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
};

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    const notifWrapper = e.target.closest('.notif-wrapper');
    const profileWrapper = e.target.closest('.profile-wrapper');

    if (!notifWrapper) {
        const notifDD = document.getElementById('notif-dropdown');
        if (notifDD) notifDD.style.display = 'none';
    }
    if (!profileWrapper) {
        const profileDD = document.getElementById('profile-dropdown');
        if (profileDD) profileDD.style.display = 'none';
    }
});
