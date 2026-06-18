/**
 * MIDAS Lab Homepage - Core Common Application JS
 * Version: 56
 */

const GOOGLE_MAIL_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";

// Element.prototype.replaceChildren Polyfill for legacy mobile browser compatibility
if (!Element.prototype.replaceChildren) {
    Element.prototype.replaceChildren = function (...nodes) {
        this.innerHTML = '';
        this.append(...nodes);
    };
}

const initApp = () => {
    const bodyElement = document.body;

    // ==========================================================================
    // Cache Busting & LocalStorage Clean Sync (Force reload client-side if version mismatch)
    // ==========================================================================
    try {
        const CURRENT_VERSION = '56';
        const currentUrl = new URL(window.location.href);
        const hasLatestVersionQuery = currentUrl.searchParams.get('v') === CURRENT_VERSION;

        if (localStorage.getItem('midas_app_version') !== CURRENT_VERSION && !hasLatestVersionQuery) {
            const savedTheme = localStorage.getItem('theme');
            const githubToken = localStorage.getItem('midas_github_token');
            localStorage.clear();
            if (savedTheme) localStorage.setItem('theme', savedTheme);
            if (githubToken) localStorage.setItem('midas_github_token', githubToken);
            localStorage.setItem('midas_app_version', CURRENT_VERSION);
            
            currentUrl.searchParams.set('v', CURRENT_VERSION);
            window.location.href = currentUrl.toString();
            return;
        }
    } catch (e) {
        console.warn("LocalStorage access failed or quota exceeded:", e);
    }

    // ==========================================================================
    // 0. Image Load Cache & Timing Issue Fix (Force trigger onload for cached images)
    // ==========================================================================
    const fixCachedImages = () => {
        const images = document.querySelectorAll('.member-photo');
        images.forEach(img => {
            if (img.complete && img.naturalWidth > 0) {
                img.style.display = 'block';
                const placeholder = img.nextElementSibling;
                if (placeholder && placeholder.classList.contains('avatar-placeholder')) {
                    placeholder.style.display = 'none';
                }
            }
        });
    };
    fixCachedImages();

    // ==========================================================================
    // 1. Theme Management (Dark / Light Mode Toggle)
    // ==========================================================================
    const themeBtn = document.getElementById('theme-toggle') || document.getElementById('themeBtn');
    const themeBtnMobile = document.getElementById('theme-toggle-mobile');

    const toggleTheme = () => {
        const currentTheme = bodyElement.classList.contains('dark-theme') ? 'dark' : 'light';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        bodyElement.classList.toggle('dark-theme', nextTheme === 'dark');
        bodyElement.classList.toggle('light-theme', nextTheme === 'light');
        localStorage.setItem('theme', nextTheme);
    };

    const loadSavedTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            bodyElement.classList.add('dark-theme');
            bodyElement.classList.remove('light-theme');
        } else {
            bodyElement.classList.remove('dark-theme');
            bodyElement.classList.add('light-theme');
        }
    };
    loadSavedTheme();

    const handleThemeToggleClick = (e) => {
        if (e) e.preventDefault();
        toggleTheme();
    };

    if (themeBtn) themeBtn.addEventListener('click', handleThemeToggleClick);
    if (themeBtnMobile) themeBtnMobile.addEventListener('click', handleThemeToggleClick);

    // ==========================================================================
    // 2. Navigation Header Scroll Effect & Sticky Header (CAU AR Lab Style)
    // ==========================================================================
    const header = document.getElementById('header');
    const handleScroll = () => {
        if (header) {
            header.classList.toggle('fixed', window.scrollY > 0);
        }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    // ==========================================================================
    // 3. Mobile sliding navigation drawer (#gnbM & .mobileMenu)
    // ==========================================================================
    const mobileMenuBtn = document.querySelector('.mobileMenu');
    const gnbM = document.getElementById('gnbM');
    
    if (mobileMenuBtn && gnbM) {
        const toggleMobileMenu = () => {
            const isOpen = gnbM.classList.toggle('open');
            mobileMenuBtn.classList.toggle('active', isOpen);
            if (isOpen) {
                bodyElement.style.overflow = 'hidden'; // Lock background scroll
            } else {
                bodyElement.style.overflow = '';
            }
        };

        mobileMenuBtn.addEventListener('click', toggleMobileMenu);

        // Close when clicking overlay space
        gnbM.addEventListener('click', (e) => {
            if (e.target === gnbM) {
                toggleMobileMenu();
            }
        });

        // Close on link click
        gnbM.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (gnbM.classList.contains('open')) {
                    toggleMobileMenu();
                }
            });
        });
    }

    // ==========================================================================
    // 4. LNB / Breadcrumbs Dropdown Selectors
    // ==========================================================================
    const lnbTitle = document.querySelector('.lnb_title a');
    const lnbMenu = document.querySelector('.lnb_menu');
    
    if (lnbTitle && lnbMenu) {
        lnbTitle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            lnbMenu.classList.toggle('open');
            lnbTitle.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            lnbMenu.classList.remove('open');
            lnbTitle.classList.remove('active');
        });
    }

    // ==========================================================================
    // 6. Unified Admin Authentication Mode (Multi-page state sync)
    // ==========================================================================
    const adminToggleBtn = document.getElementById('adminToggleBtn');
    const adminToggleMobileBtn = document.getElementById('admin-toggle-mobile');
    const adminPasswordModal = document.getElementById('adminPasswordModal');
    const adminPasswordForm = document.getElementById('adminPasswordForm');
    const adminPasswordInput = document.getElementById('adminPassword');
    const adminPasswordError = document.getElementById('adminPasswordError');
    const closeAdminModalBtn = document.getElementById('closeAdminModalBtn');
    const cancelAdminBtn = document.getElementById('cancelAdminBtn');

    const syncAdminUI = () => {
        const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
        bodyElement.classList.toggle('admin-mode', isAdmin);

        const toggleText = document.getElementById('adminToggleText');
        const toggleTextMobile = document.getElementById('adminToggleTextMobile');
        const lockIcon = document.getElementById('adminLockIcon');
        const lockIconMobile = document.getElementById('adminLockIconMobile');

        const unlockSvgHTML = `
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
        `;
        const lockSvgHTML = `
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        `;

        if (isAdmin) {
            if (toggleText) toggleText.textContent = 'Logout';
            if (toggleTextMobile) toggleTextMobile.textContent = 'Logout';
            if (lockIcon) {
                lockIcon.setAttribute('class', 'feather feather-unlock');
                lockIcon.innerHTML = unlockSvgHTML;
            }
            if (lockIconMobile) {
                lockIconMobile.setAttribute('class', 'feather feather-unlock');
                lockIconMobile.innerHTML = unlockSvgHTML;
            }
        } else {
            if (toggleText) {
                toggleText.textContent = window.location.pathname.includes('board.html') ? 'Admin Mode' : 'Admin';
            }
            if (toggleTextMobile) toggleTextMobile.textContent = 'Admin Mode';
            if (lockIcon) {
                lockIcon.setAttribute('class', 'feather feather-lock');
                lockIcon.innerHTML = lockSvgHTML;
            }
            if (lockIconMobile) {
                lockIconMobile.setAttribute('class', 'feather feather-lock');
                lockIconMobile.innerHTML = lockSvgHTML;
            }
        }
    };

    syncAdminUI();

    const handleAdminToggle = (e) => {
        if (e) e.preventDefault();
        const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
        if (isAdmin) {
            sessionStorage.removeItem('isAdmin');
            syncAdminUI();
            
            // If we are on the board page, dynamically refresh listing to sync delete buttons
            const activeFilter = document.querySelector('.filter-btn.active');
            if (activeFilter && typeof window.renderPosts === 'function') {
                window.renderPosts(activeFilter.dataset.filter);
            }
        } else {
            if (adminPasswordModal) {
                adminPasswordModal.classList.add('active');
                if (adminPasswordInput) {
                    adminPasswordInput.value = '';
                    adminPasswordInput.focus();
                }
                const tokenInput = document.getElementById('adminGithubToken');
                if (tokenInput) {
                    tokenInput.value = localStorage.getItem('midas_github_token') || '';
                }
                if (adminPasswordError) {
                    adminPasswordError.style.display = 'none';
                    adminPasswordError.textContent = '';
                }
            }
        }
    };

    if (adminToggleBtn) adminToggleBtn.addEventListener('click', handleAdminToggle);
    if (adminToggleMobileBtn) adminToggleMobileBtn.addEventListener('click', handleAdminToggle);

    if (adminPasswordForm) {
        adminPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (adminPasswordInput.value === 'midas123') {
                sessionStorage.setItem('isAdmin', 'true');
                const tokenInput = document.getElementById('adminGithubToken');
                if (tokenInput) {
                    localStorage.setItem('midas_github_token', tokenInput.value.trim());
                }
                adminPasswordModal.classList.remove('active');
                syncAdminUI();
                const activeFilter = document.querySelector('.filter-btn.active');
                if (activeFilter && typeof window.renderPosts === 'function') {
                    window.renderPosts(activeFilter.dataset.filter);
                }
            } else {
                if (adminPasswordError) {
                    adminPasswordError.textContent = '비밀번호가 일치하지 않습니다.';
                    adminPasswordError.style.display = 'block';
                }
            }
        });
    }

    const closeAdminModal = () => {
        if (adminPasswordModal) adminPasswordModal.classList.remove('active');
    };
    if (closeAdminModalBtn) closeAdminModalBtn.addEventListener('click', closeAdminModal);
    if (cancelAdminBtn) cancelAdminBtn.addEventListener('click', closeAdminModal);

    if (adminPasswordModal) {
        adminPasswordModal.addEventListener('click', (e) => {
            if (e.target === adminPasswordModal) closeAdminModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAdminModal();
            if (typeof window.closeMemberModal === 'function') window.closeMemberModal();
            if (typeof window.closePubModal === 'function') window.closePubModal();
        }
    });

    // ==========================================================================
    // 11. Contact Form Management (Only on contact.html)
    // ==========================================================================
    const contactForm = document.getElementById('contact-form');
    const formFeedback = document.getElementById('form-feedback');

    if (contactForm && formFeedback) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const nameVal = document.getElementById('user-name').value.trim();
            const emailVal = document.getElementById('user-email').value.trim();
            const subjectVal = document.getElementById('user-subject').value.trim();
            const messageVal = document.getElementById('user-message').value.trim();
            const honeypotVal = document.getElementById('user-honeypot') ? document.getElementById('user-honeypot').value : "";

            if (!nameVal || !emailVal || !subjectVal || !messageVal) {
                formFeedback.style.display = 'block';
                formFeedback.className = 'form-feedback-message error';
                formFeedback.textContent = '모든 필드를 기입해 주십시오.';
                return;
            }

            // Silent block for spambot in honeypot
            if (honeypotVal && honeypotVal.trim() !== "") {
                formFeedback.style.display = 'block';
                formFeedback.className = 'form-feedback-message success';
                formFeedback.textContent = `감사합니다, ${nameVal}님! 메세지가 전송되었습니다!`;
                contactForm.reset();
                return;
            }

            formFeedback.style.display = 'block';
            formFeedback.className = 'form-feedback-message success';
            formFeedback.textContent = '메세지를 전송 중입니다...';

            if (GOOGLE_MAIL_SCRIPT_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE" || !GOOGLE_MAIL_SCRIPT_URL) {
                formFeedback.className = 'form-feedback-message error';
                formFeedback.textContent = '구글 앱스 스크립트 웹 앱 URL이 설정되지 않았습니다. app.js 파일을 확인해 주세요.';
                return;
            }

            fetch(GOOGLE_MAIL_SCRIPT_URL, {
                method: "POST",
                mode: "cors",
                headers: { 
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify({
                    name: nameVal,
                    email: emailVal,
                    subject: subjectVal,
                    message: messageVal,
                    honeypot: honeypotVal
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.result === "success" || data.result === "spam") {
                    formFeedback.className = 'form-feedback-message success';
                    formFeedback.textContent = `감사합니다, ${nameVal}님! 메세지가 전송되었습니다!`;
                    contactForm.reset();
                } else {
                    formFeedback.className = 'form-feedback-message error';
                    formFeedback.textContent = `메세지 전송 실패: ${data.error || '알 수 없는 오류'}`;
                }
            })
            .catch(error => {
                console.error("Error submitting form:", error);
                formFeedback.className = 'form-feedback-message error';
                formFeedback.textContent = '메세지 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
            });
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
