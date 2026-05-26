/**
 * MIDAS Lab @ CAU - Dynamic JavaScript Interactions
 * Reference Style: CAU AR Lab & SNU AEML
 * Multi-page safe: all DOM queries are guarded with null checks.
 */

const initApp = () => {
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
    window.addEventListener('load', fixCachedImages);

    // ==========================================================================
    // 1. Theme Management (Dark / Light Mode Toggle)
    // ==========================================================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleMobileBtn = document.getElementById('theme-toggle-mobile');
    const bodyElement = document.body;

    const savedTheme = localStorage.getItem('theme') || 'light-theme';
    bodyElement.className = savedTheme;

    const toggleTheme = (e) => {
        if (e) e.preventDefault();
        if (bodyElement.classList.contains('dark-theme')) {
            bodyElement.classList.replace('dark-theme', 'light-theme');
            localStorage.setItem('theme', 'light-theme');
        } else {
            bodyElement.classList.replace('light-theme', 'dark-theme');
            localStorage.setItem('theme', 'dark-theme');
        }
    };

    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
    if (themeToggleMobileBtn) themeToggleMobileBtn.addEventListener('click', toggleTheme);

    // ==========================================================================
    // 2. Navigation Header Scroll Effect & Sticky Header (CAU AR Lab Style)
    // ==========================================================================
    let lastScrollY = window.scrollY;
    const header = document.getElementById('header');
    const mobileMenuBtn = document.querySelector('.mobileMenu');
    const topBtn = document.getElementById('top_btn');

    if (header) {
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > 100) {
                if (currentScrollY > lastScrollY) {
                    header.style.top = '-100px';
                    header.classList.remove('menuFixed');
                    if (mobileMenuBtn) mobileMenuBtn.classList.remove('menuFixed');
                } else {
                    header.style.top = '0px';
                    header.classList.add('menuFixed');
                    if (mobileMenuBtn) mobileMenuBtn.classList.add('menuFixed');
                }
            } else {
                header.style.top = '0px';
                header.classList.remove('menuFixed');
                if (mobileMenuBtn) mobileMenuBtn.classList.remove('menuFixed');
            }

            if (topBtn) {
                if (currentScrollY > 400) {
                    topBtn.classList.add('on');
                } else {
                    topBtn.classList.remove('on');
                }
            }
            lastScrollY = currentScrollY;
        });
    }

    if (topBtn) {
        topBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ==========================================================================
    // 3. Mobile sliding navigation drawer (#gnbM & .mobileMenu)
    // ==========================================================================
    const gnbM = document.getElementById('gnbM');
    const dimdBg = document.querySelector('.dimdBg');
    const mobileMenuXbt = document.querySelector('.mobileMenuXbt');

    if (mobileMenuBtn && gnbM) {
        const openMenu = () => {
            gnbM.classList.add('open');
            if (dimdBg) dimdBg.style.display = 'block';
        };
        const closeMenu = () => {
            gnbM.classList.remove('open');
            if (dimdBg) dimdBg.style.display = 'none';
        };

        mobileMenuBtn.addEventListener('click', openMenu);
        if (mobileMenuXbt) mobileMenuXbt.addEventListener('click', closeMenu);
        if (dimdBg) dimdBg.addEventListener('click', closeMenu);

        const gnbMLinks = gnbM.querySelectorAll('a');
        gnbMLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }

    // ==========================================================================
    // 4. LNB / Breadcrumbs Dropdown Selectors
    // ==========================================================================
    const depthMenus = document.querySelectorAll('.lnb .lnb_map li.depth');
    depthMenus.forEach(menu => {
        menu.addEventListener('click', (e) => {
            const sub = menu.querySelector('ul');
            if (sub) {
                const isDisplayed = window.getComputedStyle(sub).display === 'block';
                depthMenus.forEach(m => {
                    const otherSub = m.querySelector('ul');
                    if (otherSub) otherSub.style.display = 'none';
                });
                sub.style.display = isDisplayed ? 'none' : 'block';
            }
            e.stopPropagation();
        });
    });

    document.addEventListener('click', () => {
        depthMenus.forEach(menu => {
            const sub = menu.querySelector('ul');
            if (sub) sub.style.display = '';
        });
    });

    // ==========================================================================
    // 5. Database Initialization (Seeding)
    // ==========================================================================
    let members = [];

    const getGitHubRepoDetails = () => {
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;
        let owner = 'midas-homepage';
        let repo = 'homepage';
        if (hostname.endsWith('.github.io')) {
            owner = hostname.replace('.github.io', '');
            const parts = pathname.split('/').filter(Boolean);
            if (parts.length > 0) {
                repo = parts[0];
            }
        }
        return { owner, repo };
    };

    const saveFileToGitHub = async (path, contentString, commitMessage) => {
        const token = localStorage.getItem('midas_github_token');
        if (!token) {
            alert("GitHub Pages에서 변경 내용을 저장하려면 Admin Authentication 창에서 GitHub Personal Access Token을 먼저 입력해 주셔야 합니다.");
            throw new Error("Missing GitHub Token");
        }
        
        const { owner, repo } = getGitHubRepoDetails();
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        
        let sha = null;
        try {
            const getRes = await fetch(url, {
                headers: { 'Authorization': `token ${token}` }
            });
            if (getRes.ok) {
                const fileInfo = await getRes.json();
                sha = fileInfo.sha;
            }
        } catch (e) {
            console.warn("File might not exist yet on GitHub:", e);
        }
        
        const base64Content = btoa(unescape(encodeURIComponent(contentString)));
        const body = {
            message: commitMessage,
            content: base64Content
        };
        if (sha) {
            body.sha = sha;
        }
        
        const putRes = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (!putRes.ok) {
            const errData = await putRes.json().catch(() => ({}));
            throw new Error(errData.message || `GitHub API error: ${putRes.status}`);
        }
        console.log(`Successfully saved ${path} to GitHub: ${owner}/${repo}`);
    };

    const loadMembersFromLocalStorage = () => {
        const storedMembers = localStorage.getItem('midas_members');
        if (storedMembers) {
            try {
                members = JSON.parse(storedMembers);
            } catch (e) {
                console.error("Failed to parse stored members:", e);
            }
        }
    };

    const syncMembersToServer = async () => {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        localStorage.setItem('midas_members_sync_time', Date.now().toString());
        if (isLocal) {
            try {
                const res = await fetch('/api/save-members', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(members)
                });
                if (!res.ok) console.error('Failed to sync members to local server');
            } catch (e) {
                console.error('Error syncing members locally:', e);
            }
        } else {
            try {
                await saveFileToGitHub('data/members.json', JSON.stringify(members, null, 2), 'Update members database');
                alert("GitHub에 저장 요청이 전송되었습니다! 변경사항이 반영되기까지 약 1~2분이 소요됩니다.");
            } catch (e) {
                alert("GitHub에 저장하지 못했습니다: " + e.message);
            }
        }
    };

    const initMembers = async () => {
        const lastSync = parseInt(localStorage.getItem('midas_members_sync_time') || '0');
        const isRebuilding = (Date.now() - lastSync) < 120000; // 2 minutes

        if (!isRebuilding) {
            try {
                const response = await fetch(`data/members.json?t=${Date.now()}`);
                if (response.ok) {
                    members = await response.json();
                    localStorage.setItem('midas_members', JSON.stringify(members));
                } else {
                    throw new Error("Failed to load members.json");
                }
            } catch (err) {
                console.warn("Failed to fetch members.json, falling back to localStorage:", err);
                loadMembersFromLocalStorage();
            }
        } else {
            console.log("GitHub Pages is rebuilding. Using local cache for members.");
            loadMembersFromLocalStorage();
        }

        // Migrate to new email addresses requested by user
        let needsUpdate = false;
        const emailMigrations = {
            "daehyun-kim": "dhkim9669@gmail.com",
            "dong-geon-lee": "dlehdrjsdlgh@naver.com",
            "mansang-ha": "mansang1221@cau.ac.kr",
            "wonwoo-yoon": "yooonwoo0303@gmail.com",
            "sanghyeon-nam": "nam6592@gmail.com",
            "uk-jeong": "wjddnr513@cau.ac.kr"
        };
        members = members.map(m => {
            if (emailMigrations[m.id] && m.email !== emailMigrations[m.id]) {
                m.email = emailMigrations[m.id];
                needsUpdate = true;
            }
            return m;
        });
        if (needsUpdate) {
            localStorage.setItem('midas_members', JSON.stringify(members));
            syncMembersToServer();
        }

        renderMembers();

        // If publications were already loaded, re-render them to apply name highlighting
        if (typeof renderPublicationsList === 'function' && typeof publications !== 'undefined' && publications.length > 0) {
            renderPublicationsList(publications);
        }
    };

    // Load or initialize publications database
    let publications = [];

    const syncPublicationsToServer = async () => {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        localStorage.setItem('midas_publications_sync_time', Date.now().toString());
        if (isLocal) {
            try {
                const res = await fetch('/api/save-publications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(publications)
                });
                if (!res.ok) console.error('Failed to sync publications locally');
            } catch (e) {
                console.error('Error syncing publications locally:', e);
            }
        } else {
            try {
                await saveFileToGitHub('data/publications.json', JSON.stringify(publications, null, 2), 'Update publications database');
                alert("GitHub에 저장 요청이 전송되었습니다! 변경사항이 반영되기까지 약 1~2분이 소요됩니다.");
            } catch (e) {
                alert("GitHub에 저장하지 못했습니다: " + e.message);
            }
        }
    };

    // Helper for initials
    function getInitials(nameEn) {
        if (!nameEn) return 'ML';
        const clean = nameEn.replace(/\(.*?\)/g, '').trim();
        const parts = clean.split(/[\s-]+/).filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        } else if (parts.length === 1) {
            const p = parts[0];
            const uppers = p.match(/[A-Z]/g);
            if (uppers && uppers.length >= 2) {
                return uppers.slice(0, 2).join('');
            }
            return p.substring(0, Math.min(2, p.length)).toUpperCase();
        }
        return 'ML';
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

    // Run immediately on page load
    syncAdminUI();

    const handleAdminToggle = (e) => {
        if (e) e.preventDefault();
        const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
        if (isAdmin) {
            sessionStorage.removeItem('isAdmin');
            syncAdminUI();
            // If on board page, dynamically refresh listing to sync delete buttons
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
            closeMemberModal();
            closePubModal();
        }
    });

    // ==========================================================================
    // 7. Member Card Dynamic Rendering & Operations (index.html)
    // ==========================================================================
    const phdGrid = document.getElementById('phdGrid');
    const msGrid = document.getElementById('msGrid');
    const undergraduateGrid = document.getElementById('undergraduateGrid');
    const alumniGrid = document.getElementById('alumniGrid');

    const renderMembers = () => {
        if (!phdGrid && !msGrid && !undergraduateGrid && !alumniGrid) return;

        // Clear grids
        if (phdGrid) phdGrid.replaceChildren();
        if (msGrid) msGrid.replaceChildren();
        if (undergraduateGrid) undergraduateGrid.replaceChildren();
        if (alumniGrid) alumniGrid.replaceChildren();

        members.forEach(member => {
            const card = document.createElement('div');
            card.className = 'item';
            card.setAttribute('data-member-id', member.id);

            // Pro Image
            const proImg = document.createElement('div');
            proImg.className = 'pro_img';

            const img = document.createElement('img');
            img.className = 'member-photo';
            img.style.display = 'none';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.alt = member.nameEn;
            img.src = `images/people/${member.img || (member.id + '.jpg')}?v=${member.version || 1}`;

            const placeholder = document.createElement('div');
            placeholder.className = 'avatar-placeholder';
            placeholder.textContent = getInitials(member.nameEn);

            img.onload = () => {
                img.style.display = 'block';
                placeholder.style.display = 'none';
            };
            img.onerror = () => {
                img.style.display = 'none';
                placeholder.style.display = 'flex';
            };

            proImg.appendChild(img);
            proImg.appendChild(placeholder);
            card.appendChild(proImg);

            // Pro Info
            const proInfo = document.createElement('div');
            proInfo.className = 'pro_info';

            const proName = document.createElement('div');
            proName.className = 'pro_name';
            const koNameSpan = document.createElement('span');
            koNameSpan.className = 'ko_name';
            koNameSpan.textContent = member.nameKo;
            const enNameSpan = document.createElement('span');
            enNameSpan.className = 'en_name';
            enNameSpan.textContent = member.nameEn;
            proName.appendChild(koNameSpan);
            proName.appendChild(enNameSpan);
            proInfo.appendChild(proName);

            const proSub = document.createElement('div');
            proSub.className = 'pro_sub';
            proSub.textContent = member.role;
            proInfo.appendChild(proSub);

            const proSubTxt = document.createElement('div');
            proSubTxt.className = 'pro_sub_txt';
            proSubTxt.textContent = member.research;
            proInfo.appendChild(proSubTxt);

            if (member.email) {
                const emailList = document.createElement('ul');
                const emailItem = document.createElement('li');
                emailItem.className = 'member-email-item';

                const emailBtn = document.createElement('button');
                emailBtn.className = 'member-email-btn';
                emailBtn.type = 'button';
                emailBtn.title = '이메일 보기';
                emailBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="email-icon">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                `;

                const emailLink = document.createElement('a');
                emailLink.className = 'member-email-link';
                emailLink.href = `mailto:${member.email}`;
                emailLink.textContent = member.email;

                emailBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isVisible = emailLink.classList.contains('visible');
                    if (isVisible) {
                        emailLink.classList.remove('visible');
                        emailBtn.classList.remove('active');
                        emailBtn.title = '이메일 보기';
                    } else {
                        emailLink.classList.add('visible');
                        emailBtn.classList.add('active');
                        emailBtn.title = '이메일 가리기';
                    }
                });

                emailItem.appendChild(emailBtn);
                emailItem.appendChild(emailLink);
                emailList.appendChild(emailItem);
                proInfo.appendChild(emailList);
            }

            // Current position for Alumni
            if (member.group === 'alumni' && member.current) {
                const proCurrent = document.createElement('div');
                proCurrent.className = 'pro_current';
                proCurrent.textContent = member.current;
                proInfo.appendChild(proCurrent);
            }

            const eduWrap = document.createElement('div');
            eduWrap.className = 'edu_wrap';
            const eduP = document.createElement('p');
            eduP.textContent = 'Education';
            eduWrap.appendChild(eduP);
            proInfo.appendChild(eduWrap);

            card.appendChild(proInfo);

            // Admin Card Overlay
            const adminActions = document.createElement('div');
            adminActions.className = 'card-admin-actions admin-only';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn-card-edit';
            editBtn.type = 'button';
            editBtn.title = 'Edit Member';
            editBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit-2">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
            `;
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openMemberEditModal(member);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-card-delete';
            deleteBtn.type = 'button';
            deleteBtn.title = 'Delete Member';
            deleteBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            `;
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteMember(member.id);
            });

            adminActions.appendChild(editBtn);
            adminActions.appendChild(deleteBtn);
            card.appendChild(adminActions);

            // Card click logic opens detail modal
            card.addEventListener('click', () => {
                openEducationModal(member.id);
            });

            // Force cache check
            if (img.complete) {
                img.onload();
            }

            // Append to appropriate grid
            if (member.group === 'graduate') {
                const role = member.role || '';
                if (role.toLowerCase().includes('ph.d')) {
                    if (phdGrid) phdGrid.appendChild(card);
                } else {
                    if (msGrid) msGrid.appendChild(card);
                }
            } else if (member.group === 'undergraduate') {
                if (undergraduateGrid) undergraduateGrid.appendChild(card);
            } else if (member.group === 'alumni') {
                if (alumniGrid) alumniGrid.appendChild(card);
            }
        });
    };

    // Initialize rendering immediately
    initMembers();

    // ==========================================================================
    // 8. Education Detail Modal Setup
    // ==========================================================================
    const modalOverlay = document.getElementById('modal-overlay');
    const educationModal = document.getElementById('education-modal');
    const modalInfoContent = document.getElementById('modal-info-content');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    const openEducationModal = (memberId) => {
        const data = members.find(m => m.id === memberId);
        if (!data || !modalInfoContent || !educationModal || !modalOverlay) return;

        modalInfoContent.replaceChildren();

        const proNameDiv = document.createElement('div');
        proNameDiv.className = 'pro_name';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'ko_name';
        nameSpan.textContent = `${data.nameKo} (${data.nameEn})`;
        proNameDiv.appendChild(nameSpan);
        modalInfoContent.appendChild(proNameDiv);

        if (data.education && data.education.length > 0) {
            data.education.forEach(edu => {
                const subDiv = document.createElement('div');
                subDiv.className = 'modal_sub';
                
                const boldSpan = document.createElement('span');
                boldSpan.className = 'txt_bold';
                boldSpan.textContent = edu.degree;
                subDiv.appendChild(boldSpan);
                
                const detailText = document.createTextNode(' ' + edu.detail);
                subDiv.appendChild(detailText);
                
                modalInfoContent.appendChild(subDiv);
            });
        } else {
            const noEdu = document.createElement('div');
            noEdu.className = 'modal_sub';
            noEdu.textContent = '등록된 학력 정보가 없습니다.';
            modalInfoContent.appendChild(noEdu);
        }

        modalOverlay.style.display = 'block';
        educationModal.style.display = 'block';
        educationModal.offsetHeight; // Reflow
        educationModal.classList.add('open');
    };

    const closeEducationModal = (e) => {
        if (e) e.preventDefault();
        if (educationModal) {
            educationModal.classList.remove('open');
            setTimeout(() => {
                educationModal.style.display = 'none';
                if (modalOverlay) modalOverlay.style.display = 'none';
            }, 300);
        }
    };

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeEducationModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeEducationModal);

    // ==========================================================================
    // 9. Member CRUD Operations
    // ==========================================================================
    const memberEditModal = document.getElementById('memberEditModal');
    const memberEditForm = document.getElementById('memberEditForm');
    const memberModalTitle = document.getElementById('memberModalTitle');
    const closeMemberModalBtn = document.getElementById('closeMemberModalBtn');
    const cancelMemberBtn = document.getElementById('cancelMemberBtn');
    const memberEduRows = document.getElementById('memberEduRows');
    const addEduRowBtn = document.getElementById('addEduRowBtn');

    // Trigger buttons
    const addMemberPhdBtn = document.getElementById('addMemberPhdBtn');
    const addMemberMsBtn = document.getElementById('addMemberMsBtn');
    const addMemberUndergradBtn = document.getElementById('addMemberUndergradBtn');
    const addMemberAlumniBtn = document.getElementById('addMemberAlumniBtn');

    const addEduRow = (degree = '', detail = '') => {
        if (!memberEduRows) return;
        const row = document.createElement('div');
        row.className = 'edu-row';
        row.style.display = 'flex';
        row.style.gap = '10px';
        row.style.alignItems = 'center';

        const degInput = document.createElement('input');
        degInput.type = 'text';
        degInput.placeholder = '학위 (Degree)';
        degInput.className = 'form-control-input edu-degree';
        degInput.value = degree;
        degInput.required = true;
        degInput.style.flex = '1';
        degInput.style.padding = '8px';
        degInput.style.border = '1px solid var(--border-color)';
        degInput.style.borderRadius = '4px';
        degInput.style.background = 'var(--bg-surface)';
        degInput.style.color = 'var(--text-main)';

        const detInput = document.createElement('input');
        detInput.type = 'text';
        detInput.placeholder = '상세 정보 (Detail)';
        detInput.className = 'form-control-input edu-detail';
        detInput.value = detail;
        detInput.required = true;
        detInput.style.flex = '1.5';
        detInput.style.padding = '8px';
        detInput.style.border = '1px solid var(--border-color)';
        detInput.style.borderRadius = '4px';
        detInput.style.background = 'var(--bg-surface)';
        detInput.style.color = 'var(--text-main)';

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.style.padding = '8px 12px';
        delBtn.style.background = '#e53e3e';
        delBtn.style.color = '#ffffff';
        delBtn.style.border = 'none';
        delBtn.style.borderRadius = '4px';
        delBtn.style.cursor = 'pointer';
        delBtn.textContent = 'Del';
        delBtn.addEventListener('click', () => {
            row.remove();
        });

        row.appendChild(degInput);
        row.appendChild(detInput);
        row.appendChild(delBtn);
        memberEduRows.appendChild(row);
    };

    if (addEduRowBtn) {
        addEduRowBtn.addEventListener('click', () => {
            addEduRow();
        });
    }

    const openMemberAddModal = (defaultGroup, defaultRole) => {
        if (!memberEditModal || !memberEditForm) return;
        memberModalTitle.textContent = 'Add New Member';
        memberEditForm.reset();
        document.getElementById('editMemberIdOld').value = '';
        document.getElementById('memberId').disabled = false;
        document.getElementById('memberGroup').value = defaultGroup;
        document.getElementById('memberRole').value = defaultRole;

        const photoFile = document.getElementById('memberPhotoFile');
        if (photoFile) photoFile.value = '';
        const previewImg = document.getElementById('memberPhotoPreview');
        if (previewImg) {
            previewImg.style.display = 'none';
            previewImg.src = '';
        }
        const previewPlaceholder = document.getElementById('memberPhotoPreviewPlaceholder');
        if (previewPlaceholder) {
            previewPlaceholder.style.display = 'flex';
            previewPlaceholder.textContent = 'NEW';
        }

        if (memberEduRows) memberEduRows.replaceChildren();
        addEduRow(); // add one default education row
        memberEditModal.classList.add('active');
    };

    if (addMemberPhdBtn) {
        addMemberPhdBtn.addEventListener('click', () => {
            openMemberAddModal('graduate', 'Ph.D. Candidate');
        });
    }
    if (addMemberMsBtn) {
        addMemberMsBtn.addEventListener('click', () => {
            openMemberAddModal('graduate', 'M.S. Student');
        });
    }
    if (addMemberUndergradBtn) {
        addMemberUndergradBtn.addEventListener('click', () => {
            openMemberAddModal('undergraduate', 'Undergraduate Intern');
        });
    }
    if (addMemberAlumniBtn) {
        addMemberAlumniBtn.addEventListener('click', () => {
            openMemberAddModal('alumni', 'Alumni');
        });
    }

    const openMemberEditModal = (member) => {
        if (!memberEditModal || !memberEditForm) return;
        memberModalTitle.textContent = 'Edit Member Profile';
        document.getElementById('editMemberIdOld').value = member.id;
        
        const idField = document.getElementById('memberId');
        idField.value = member.id;
        idField.disabled = true; // cannot change ID directly on edit

        document.getElementById('memberGroup').value = member.group;
        document.getElementById('memberNameKo').value = member.nameKo;
        document.getElementById('memberNameEn').value = member.nameEn;
        document.getElementById('memberRole').value = member.role;
        document.getElementById('memberResearch').value = member.research;
        document.getElementById('memberEmail').value = member.email || '';
        document.getElementById('memberCurrent').value = member.current || '';
        document.getElementById('memberImg').value = member.img || '';

        const photoFile = document.getElementById('memberPhotoFile');
        if (photoFile) photoFile.value = '';

        const previewImg = document.getElementById('memberPhotoPreview');
        const previewPlaceholder = document.getElementById('memberPhotoPreviewPlaceholder');
        if (previewImg) {
            previewImg.style.display = 'none';
            previewImg.src = `images/people/${member.img || (member.id + '.jpg')}?t=${Date.now()}`;
            previewImg.onload = () => {
                previewImg.style.display = 'block';
                if (previewPlaceholder) previewPlaceholder.style.display = 'none';
            };
            previewImg.onerror = () => {
                previewImg.style.display = 'none';
                if (previewPlaceholder) {
                    previewPlaceholder.style.display = 'flex';
                    previewPlaceholder.textContent = getInitials(member.nameEn);
                }
            };
        }

        if (memberEduRows) memberEduRows.replaceChildren();
        if (member.education && member.education.length > 0) {
            member.education.forEach(edu => {
                addEduRow(edu.degree, edu.detail);
            });
        } else {
            addEduRow();
        }

        memberEditModal.classList.add('active');
    };

    const closeMemberModal = () => {
        if (memberEditModal) memberEditModal.classList.remove('active');
    };
    if (closeMemberModalBtn) closeMemberModalBtn.addEventListener('click', closeMemberModal);
    if (cancelMemberBtn) cancelMemberBtn.addEventListener('click', closeMemberModal);

    // Live preview for photo uploads
    const memberPhotoFile = document.getElementById('memberPhotoFile');
    if (memberPhotoFile) {
        memberPhotoFile.addEventListener('change', () => {
            if (memberPhotoFile.files.length > 0) {
                const file = memberPhotoFile.files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewImg = document.getElementById('memberPhotoPreview');
                    const previewPlaceholder = document.getElementById('memberPhotoPreviewPlaceholder');
                    if (previewImg) {
                        previewImg.src = e.target.result;
                        previewImg.style.display = 'block';
                    }
                    if (previewPlaceholder) {
                        previewPlaceholder.style.display = 'none';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Auto-generate image filename when typing member ID
    const idField = document.getElementById('memberId');
    const imgField = document.getElementById('memberImg');
    if (idField && imgField) {
        idField.addEventListener('input', () => {
            const cleanId = idField.value.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '');
            imgField.value = cleanId ? cleanId + '.jpg' : '';
        });
    }

    // Image Compressor Helper for member photos
    const resizeAndCompressMemberImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Scale down if dimensions exceed 500px
                    const maxDim = 500;
                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Export as JPEG with 0.85 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    resolve(dataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    if (memberEditForm) {
        memberEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const saveBtn = document.getElementById('saveMemberBtn');
            let originalText = '';
            if (saveBtn) {
                originalText = saveBtn.textContent;
                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving...';
            }

            try {
                const idOld = document.getElementById('editMemberIdOld').value;
                const id = document.getElementById('memberId').value.trim();
                const group = document.getElementById('memberGroup').value;
                const nameKo = document.getElementById('memberNameKo').value.trim();
                const nameEn = document.getElementById('memberNameEn').value.trim();
                const role = document.getElementById('memberRole').value.trim();
                const research = document.getElementById('memberResearch').value.trim();
                const email = document.getElementById('memberEmail').value.trim();
                const current = document.getElementById('memberCurrent').value.trim();
                const imgVal = document.getElementById('memberImg').value.trim() || (id + '.jpg');

                // If a new photo file was uploaded
                const photoFile = memberPhotoFile ? memberPhotoFile.files[0] : null;
                if (photoFile) {
                    const compressedData = await resizeAndCompressMemberImage(photoFile);
                    
                    // Upload to python server
                    const uploadRes = await fetch('/api/upload-member-photo', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            filename: imgVal,
                            image: compressedData
                        })
                    });
                    
                    if (!uploadRes.ok) {
                        throw new Error('사진 업로드에 실패했습니다. 서버 상태를 확인해주세요.');
                    }
                    
                    const uploadResult = await uploadRes.json();
                    if (uploadResult.status !== 'success') {
                        throw new Error(uploadResult.message || '사진 업로드 실패');
                    }
                }

                // Extract education rows
                const eduRows = document.querySelectorAll('.edu-row');
                const education = [];
                eduRows.forEach(row => {
                    const deg = row.querySelector('.edu-degree').value.trim();
                    const det = row.querySelector('.edu-detail').value.trim();
                    if (deg && det) {
                        education.push({ degree: deg, detail: det });
                    }
                });

                const newMember = {
                    id, group, nameKo, nameEn, role, research, email, current, img: imgVal, education,
                    version: Date.now()
                };

                if (idOld) {
                    // Edit mode
                    const idx = members.findIndex(m => m.id === idOld);
                    if (idx > -1) {
                        members[idx] = newMember;
                    }
                } else {
                    // Add mode
                    if (members.some(m => m.id === id)) {
                        alert('이미 존재하는 고유 ID입니다. 다른 ID를 사용해주세요.');
                        if (saveBtn) {
                            saveBtn.disabled = false;
                            saveBtn.textContent = originalText;
                        }
                        return;
                    }
                    members.push(newMember);
                }

                localStorage.setItem('midas_members', JSON.stringify(members));
                syncMembersToServer();
                closeMemberModal();
                renderMembers();
            } catch (err) {
                alert('저장 도중 오류가 발생했습니다: ' + err.message);
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = originalText || 'Save';
                }
            }
        });
     }

     const deleteMember = (id) => {
        if (confirm(`정말로 ${id} 구성원을 삭제하시겠습니까?`)) {
            members = members.filter(m => m.id !== id);
            localStorage.setItem('midas_members', JSON.stringify(members));
            syncMembersToServer();
            renderMembers();
        }
     };

    // ==========================================================================
    // 10. Publications Data, Search, Filtering & CRUD (publications.html)
    // ==========================================================================
    const pubListContainer = document.getElementById('pub-list-container');
    const searchInput = document.getElementById('pub-search-input');
    const filterYear = document.getElementById('pub-filter-year');
    const filterType = document.getElementById('pub-filter-type');
    const addPubBtn = document.getElementById('addPubBtn');

    if (pubListContainer) {
        const showLoading = () => {
            pubListContainer.replaceChildren();
            const loadingEl = document.createElement('div');
            loadingEl.className = 'no-results';
            loadingEl.textContent = '논문 데이터를 불러오는 중입니다...';
            pubListContainer.appendChild(loadingEl);
        };
        showLoading();

        // Render function
        function renderPublicationsList(items) {
            pubListContainer.replaceChildren();

            if (items.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = '검색 조건에 부합하는 논문이 없습니다.';
                pubListContainer.appendChild(noResults);
                return;
            }

            items.forEach((pub) => {
                // Find actual index in global publications array
                const originalIndex = publications.findIndex(p => p.title === pub.title && p.year === pub.year);

                const article = document.createElement('article');
                article.className = 'pub-item glass-panel';
                article.setAttribute('data-year', pub.year);
                article.setAttribute('data-status', pub.status);

                const badge = document.createElement('div');
                badge.className = 'pub-year-badge';

                const pubNum = document.createElement('span');
                pubNum.className = 'pub-num';
                pubNum.textContent = `#${publications.length - originalIndex}`;

                const pubYear = document.createElement('span');
                pubYear.className = 'pub-year';
                pubYear.textContent = pub.year;

                badge.appendChild(pubNum);
                badge.appendChild(pubYear);
                article.appendChild(badge);

                const content = document.createElement('div');
                content.className = 'pub-content';

                const title = document.createElement('h4');
                title.className = 'pub-title';
                title.textContent = pub.title;
                content.appendChild(title);

                const authors = document.createElement('p');
                authors.className = 'pub-authors';

                const normalizeName = (nameStr) => {
                    if (!nameStr) return '';
                    return nameStr.toLowerCase().replace(/[\s\-\*\†\+\(\)]/g, '');
                };
                
                const authorList = Array.isArray(pub.authors) ? pub.authors : pub.authors.split(',').map(a => a.trim());
                authorList.forEach((author, idx) => {
                    let cleanName = author.trim();
                    let isEqualContribution = false;
                    let isCorresponding = false;

                    if (cleanName.includes('†')) {
                        isEqualContribution = true;
                        cleanName = cleanName.replace(/†/g, '');
                    }
                    if (cleanName.includes('*')) {
                        isCorresponding = true;
                        cleanName = cleanName.replace(/\*/g, '');
                    }
                    cleanName = cleanName.trim();

                    const normClean = normalizeName(cleanName);
                    const isMember = members.some(m => normalizeName(m.nameEn) === normClean || normalizeName(m.nameKo) === normClean);
                    const isProfessor = normClean === 'haesunpark' || cleanName.includes('박해선');

                    const authorSpan = document.createElement('span');
                    authorSpan.className = 'pub-author-item';

                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = cleanName;
                    if (isMember || isProfessor) {
                        nameSpan.className = 'author-highlight';
                    }
                    authorSpan.appendChild(nameSpan);

                    if (isEqualContribution) {
                        const sup = document.createElement('sup');
                        sup.textContent = '†';
                        sup.style.cursor = 'help';
                        sup.setAttribute('title', 'Equal Contribution');
                        authorSpan.appendChild(sup);
                    }
                    if (isCorresponding) {
                        const sup = document.createElement('sup');
                        sup.textContent = '*';
                        sup.style.cursor = 'help';
                        sup.setAttribute('title', 'Corresponding Author');
                        authorSpan.appendChild(sup);
                    }

                    authors.appendChild(authorSpan);
                    
                    if (idx < authorList.length - 1) {
                        authors.appendChild(document.createTextNode(', '));
                    }
                });
                content.appendChild(authors);

                const journal = document.createElement('p');
                journal.className = 'pub-journal';
                journal.textContent = pub.journal;
                content.appendChild(journal);

                if (pub.doi || pub.pdf) {
                    const linksContainer = document.createElement('div');
                    linksContainer.className = 'pub-links';

                    if (pub.doi) {
                        const doiLink = document.createElement('a');
                        doiLink.setAttribute('href', pub.doi);
                        doiLink.setAttribute('target', '_blank');
                        doiLink.setAttribute('rel', 'noopener');
                        doiLink.className = 'pub-btn btn-doi';
                        doiLink.textContent = 'DOI';
                        linksContainer.appendChild(doiLink);
                    }

                    if (pub.pdf) {
                        const pdfLink = document.createElement('a');
                        pdfLink.setAttribute('href', pub.pdf);
                        pdfLink.setAttribute('target', '_blank');
                        pdfLink.setAttribute('rel', 'noopener');
                        pdfLink.className = 'pub-btn btn-pdf';
                        pdfLink.textContent = 'PDF';
                        linksContainer.appendChild(pdfLink);
                    }

                    content.appendChild(linksContainer);
                }

                article.appendChild(content);

                // Admin Pub Actions Overlay
                const pubAdminActions = document.createElement('div');
                pubAdminActions.className = 'pub-admin-actions admin-only';

                const editPubBtn = document.createElement('button');
                editPubBtn.className = 'btn-pub-edit';
                editPubBtn.type = 'button';
                editPubBtn.textContent = 'Edit';
                editPubBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openPubEditModal(pub, originalIndex);
                });

                const deletePubBtn = document.createElement('button');
                deletePubBtn.className = 'btn-pub-delete';
                deletePubBtn.type = 'button';
                deletePubBtn.textContent = 'Delete';
                deletePubBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deletePublication(originalIndex);
                });

                pubAdminActions.appendChild(editPubBtn);
                pubAdminActions.appendChild(deletePubBtn);
                article.appendChild(pubAdminActions);

                pubListContainer.appendChild(article);
            });
        }

        // Filtering
        function filterPublications() {
            const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
            const selectedYear = filterYear ? filterYear.value : 'all';
            const selectedType = filterType ? filterType.value : 'all';

            const filtered = publications.filter(pub => {
                const authorList = Array.isArray(pub.authors) ? pub.authors : pub.authors.split(',').map(a => a.trim());
                const matchesQuery = !query || 
                    pub.title.toLowerCase().includes(query) || 
                    pub.journal.toLowerCase().includes(query) || 
                    authorList.some(author => author.toLowerCase().includes(query));

                const matchesYear = selectedYear === 'all' || String(pub.year) === String(selectedYear);

                let matchesType = true;
                if (selectedType === 'published') {
                    matchesType = pub.status === 'published';
                } else if (selectedType === 'review') {
                    matchesType = pub.status === 'review';
                }

                return matchesQuery && matchesYear && matchesType;
            });

            renderPublicationsList(filtered);
        }

        const updateYearFilterDropdown = () => {
            if (!filterYear) return;
            const years = [...new Set(publications.map(p => String(p.year)))].sort((a, b) => b - a);
            filterYear.replaceChildren();
            const allOption = document.createElement('option');
            allOption.value = 'all';
            allOption.textContent = '모든 연도';
            filterYear.appendChild(allOption);
            years.forEach(y => {
                const opt = document.createElement('option');
                opt.value = y;
                opt.textContent = y;
                filterYear.appendChild(opt);
            });
        };

        if (searchInput) searchInput.addEventListener('input', filterPublications);
        if (filterYear) filterYear.addEventListener('change', filterPublications);
        if (filterType) filterType.addEventListener('change', filterPublications);

        // Fetch / Seeding Publications Flow
        const initPublications = async () => {
            const lastSync = parseInt(localStorage.getItem('midas_publications_sync_time') || '0');
            const isRebuilding = (Date.now() - lastSync) < 120000;

            const loadPubsFromLocalStorage = () => {
                const storedPubs = localStorage.getItem('midas_publications');
                if (storedPubs) {
                    try {
                        publications = JSON.parse(storedPubs);
                    } catch (e) {
                        console.error("Failed to parse stored publications:", e);
                    }
                }
            };

            if (!isRebuilding) {
                try {
                    const response = await fetch(`data/publications.json?t=${Date.now()}`);
                    if (response.ok) {
                        publications = await response.json();
                        localStorage.setItem('midas_publications', JSON.stringify(publications));
                    } else {
                        throw new Error("Failed to load publications.json");
                    }
                } catch (err) {
                    console.warn("Failed to fetch publications.json, falling back to localStorage:", err);
                    loadPubsFromLocalStorage();
                }
            } else {
                console.log("GitHub Pages is rebuilding. Using local cache for publications.");
                loadPubsFromLocalStorage();
            }
            renderPublicationsList(publications);
            updateYearFilterDropdown();
        };

        initPublications();

        // Publication Add / Edit modal hooks
        const pubEditModal = document.getElementById('pubEditModal');
        const pubEditForm = document.getElementById('pubEditForm');
        const pubModalTitle = document.getElementById('pubModalTitle');
        const closePubModalBtn = document.getElementById('closePubModalBtn');
        const cancelPubBtn = document.getElementById('cancelPubBtn');

        const openPubEditModal = (pub, index) => {
            if (!pubEditModal || !pubEditForm) return;
            if (pub) {
                pubModalTitle.textContent = 'Edit Publication';
                document.getElementById('editPubIndex').value = index;
                document.getElementById('pubTitle').value = pub.title;
                const authorList = Array.isArray(pub.authors) ? pub.authors : pub.authors.split(',').map(a => a.trim());
                document.getElementById('pubAuthors').value = authorList.join(', ');
                document.getElementById('pubJournal').value = pub.journal;
                document.getElementById('pubYear').value = pub.year;
                document.getElementById('pubStatus').value = pub.status;
                document.getElementById('pubDoi').value = pub.doi || '';
                document.getElementById('pubPdf').value = pub.pdf || '';
            } else {
                pubModalTitle.textContent = 'Add New Publication';
                pubEditForm.reset();
                document.getElementById('editPubIndex').value = '';
            }
            pubEditModal.classList.add('active');
        };

        if (addPubBtn) {
            addPubBtn.addEventListener('click', () => {
                openPubEditModal(null, null);
            });
        }

        const closePubModal = () => {
            if (pubEditModal) pubEditModal.classList.remove('active');
        };
        if (closePubModalBtn) closePubModalBtn.addEventListener('click', closePubModal);
        if (cancelPubBtn) cancelPubBtn.addEventListener('click', closePubModal);

        if (pubEditModal) {
            pubEditModal.addEventListener('click', (e) => {
                if (e.target === pubEditModal) closePubModal();
            });
        }

        if (pubEditForm) {
            pubEditForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const index = document.getElementById('editPubIndex').value;
                const title = document.getElementById('pubTitle').value.trim();
                const authorsRaw = document.getElementById('pubAuthors').value.trim();
                const authors = authorsRaw.split(',').map(a => a.trim()).filter(Boolean);
                const journal = document.getElementById('pubJournal').value.trim();
                const year = parseInt(document.getElementById('pubYear').value.trim());
                const status = document.getElementById('pubStatus').value;
                const doi = document.getElementById('pubDoi').value.trim();
                const pdf = document.getElementById('pubPdf').value.trim();

                const newPub = { title, authors, journal, year, status, doi, pdf };

                if (index !== '') {
                    // edit
                    publications[parseInt(index)] = newPub;
                } else {
                    // add
                    publications.push(newPub);
                }

                localStorage.setItem('midas_publications', JSON.stringify(publications));
                syncPublicationsToServer();
                closePubModal();
                filterPublications();
                updateYearFilterDropdown();
            });
        }

        const deletePublication = (index) => {
            if (confirm('정말로 이 논문을 삭제하시겠습니까?')) {
                publications.splice(index, 1);
                localStorage.setItem('midas_publications', JSON.stringify(publications));
                syncPublicationsToServer();
                filterPublications();
                updateYearFilterDropdown();
            }
        };

        // Make these functions globally accessible so the escape key listener can close them
        window.closePubModal = closePubModal;
    }

    // fallback definition so keydown can call safely
    window.closePubModal = window.closePubModal || (() => {});
    window.closeMemberModal = closeMemberModal;

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

            if (!nameVal || !emailVal || !subjectVal || !messageVal) {
                formFeedback.className = 'form-feedback-message error';
                formFeedback.textContent = '모든 필드를 기입해 주십시오.';
                return;
            }

            formFeedback.className = 'form-feedback-message success';
            formFeedback.textContent = `감사합니다, ${nameVal}님! 메시지가 정상적으로 가상 전송되었습니다. 박해선 교수님(parkh@cau.ac.kr)께 연락하시거나 답장을 대기해 주세요.`;

            contactForm.reset();
            
            setTimeout(() => {
                formFeedback.style.display = 'none';
            }, 6000);
        });
    }

    // ==========================================================================
    // 12. Scrollspy for single-page scrolling layout (index.html)
    // ==========================================================================
    const sections = document.querySelectorAll('main > section[id]');
    const navLinks = document.querySelectorAll('#cssmenu > ul > li > a');
    const mobileLinks = document.querySelectorAll('#gnbM .gnbDiv a.one');

    if (sections.length > 0) {
        const getHeaderOffset = () => {
            const width = window.innerWidth;
            if (width > 1024) return 100;
            if (width > 768) return 80;
            return 65;
        };

        const handleScrollspy = () => {
            const scrollPos = window.scrollY || document.documentElement.scrollTop;
            const headerOffset = getHeaderOffset();
            const buffer = 15;
            const offset = headerOffset + buffer;

            let currentSectionId = '';

            sections.forEach(section => {
                const sectionTop = section.offsetTop - offset;
                const sectionHeight = section.offsetHeight;

                if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                    currentSectionId = section.getAttribute('id');
                }
            });

            if ((window.innerHeight + scrollPos) >= document.documentElement.scrollHeight - 50) {
                currentSectionId = 'contact';
            }

            if (scrollPos < 50) {
                currentSectionId = 'overview';
            }

            if (currentSectionId) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    const href = link.getAttribute('href');
                    if (href === `#${currentSectionId}` || href.endsWith(`index.html#${currentSectionId}`) || href === `index.html#${currentSectionId}`) {
                        link.classList.add('active');
                    }
                });

                mobileLinks.forEach(link => {
                    link.classList.remove('on');
                    const href = link.getAttribute('href');
                    if (href === `#${currentSectionId}` || href.endsWith(`index.html#${currentSectionId}`) || href === `index.html#${currentSectionId}`) {
                        link.classList.add('on');
                    }
                });
            }
        };

        window.addEventListener('scroll', handleScrollspy);
        window.addEventListener('resize', handleScrollspy);
        handleScrollspy();
    }

    // ==========================================================================
    // 13. Home Page News Ticker Automation (index.html)
    // ==========================================================================
    const newsTrack = document.querySelector('.news-carousel-track');
    if (newsTrack) {
        const loadNewsTicker = async () => {
            let posts = [];
            const lastSync = parseInt(localStorage.getItem('midas_posts_sync_time') || '0');
            const isRebuilding = (Date.now() - lastSync) < 120000;

            const loadPostsFromLocalStorageNews = () => {
                try {
                    const stored = localStorage.getItem('midas_board_posts');
                    if (stored) {
                        return JSON.parse(stored);
                    }
                } catch (err) {
                    console.error("Failed to parse stored posts:", err);
                }
                return [];
            };

            if (!isRebuilding) {
                try {
                    const res = await fetch(`data/posts.json?t=${Date.now()}`);
                    if (res.ok) {
                        posts = await res.json();
                        localStorage.setItem('midas_board_posts', JSON.stringify(posts));
                    } else {
                        throw new Error("Fetch failed");
                    }
                } catch (e) {
                    console.warn("Failed to fetch posts.json for news ticker, falling back to localStorage:", e);
                    posts = loadPostsFromLocalStorageNews();
                }
            } else {
                console.log("GitHub Pages is rebuilding. Using local cache for news ticker.");
                posts = loadPostsFromLocalStorageNews();
            }
            
            // Filter categories = 'news'
            const newsPosts = posts.filter(p => p && p.category === 'news');
            
            // Sort by date descending
            newsPosts.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                if (dateB - dateA !== 0) return dateB - dateA;
                return (b.id || 0) - (a.id || 0);
            });
            
            // Take top 3
            const topNews = newsPosts.slice(0, 3);
            
            newsTrack.replaceChildren();
            
            if (topNews.length === 0) {
                const noNews = document.createElement('div');
                noNews.className = 'news-item';
                noNews.innerHTML = '<span class="news-text">등록된 최신 뉴스가 없습니다.</span>';
                newsTrack.appendChild(noNews);
                return;
            }
            
            // Render items
            topNews.forEach(post => {
                const item = document.createElement('div');
                item.className = 'news-item';
                
                // Format date from YYYY-MM-DD to YYYY.MM.DD
                const formattedDate = post.date ? post.date.replace(/\-/g, '.') : '';
                
                const dateSpan = document.createElement('span');
                dateSpan.className = 'news-date';
                dateSpan.textContent = formattedDate;
                
                const textSpan = document.createElement('span');
                textSpan.className = 'news-text';
                textSpan.textContent = post.title;
                
                item.appendChild(dateSpan);
                item.appendChild(textSpan);
                newsTrack.appendChild(item);
            });
            
            // For seamless ticker loop, clone the first item and append it
            if (topNews.length > 1) {
                const clone = newsTrack.firstElementChild.cloneNode(true);
                newsTrack.appendChild(clone);
            }
        };
        loadNewsTicker();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
