/**
 * AiM Lab Homepage - Home Page (index.html) Specialized Modules
 * Version: 51
 */

(() => {
    // Check if we are on the home page (index.html or root) or research subpage
    const hasHomeElements = document.querySelector('main > section[id="overview"]') || document.getElementById('home-news-gallery') || document.querySelector('.research-tabs');
    if (!hasHomeElements) return;

    const initHomeModule = () => {
        initScrollspy();
        initNewsTicker();
        initResearchTabs();
        initHeroStats();
        initHomeNewsGallery();
    };

    // ==========================================================================
    // 12. Scrollspy for single-page scrolling layout (index.html)
    // ==========================================================================
    const initScrollspy = () => {
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
                        if (href && (href === `#${currentSectionId}` || href.endsWith(`index.html#${currentSectionId}`) || href === `index.html#${currentSectionId}`)) {
                            link.classList.add('active');
                        }
                    });

                    mobileLinks.forEach(link => {
                        link.classList.remove('on');
                        const href = link.getAttribute('href');
                        if (href && (href === `#${currentSectionId}` || href.endsWith(`index.html#${currentSectionId}`) || href === `index.html#${currentSectionId}`)) {
                            link.classList.add('on');
                        }
                    });
                }
            };

            window.addEventListener('scroll', handleScrollspy);
            window.addEventListener('resize', handleScrollspy);
            handleScrollspy();
        }
    };

    // ==========================================================================
    // 13. Home Page News Ticker Automation (index.html)
    // ==========================================================================
    const initNewsTicker = () => {
        const newsTrack = document.querySelector('.news-carousel-track');
        if (newsTrack) {
            const loadNewsTicker = async () => {
                let topNews = [];

                try {
                    const res = await fetch(`data/news_ticker.json?t=${Date.now()}`);
                    if (res.ok) {
                        topNews = await res.json();
                    } else {
                        throw new Error("Fetch failed");
                    }
                } catch (e) {
                    console.warn("Failed to fetch news_ticker.json for news ticker:", e);
                }
                
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
                
                if (topNews.length > 1) {
                    const clone = newsTrack.firstElementChild.cloneNode(true);
                    newsTrack.appendChild(clone);
                }
            };
            loadNewsTicker();
        }
    };

    // ==========================================================================
    // 13. Research Section Tab Toggle Logic
    // ==========================================================================
    const initResearchTabs = () => {
        const tabBtns = document.querySelectorAll('.research-tab-btn');
        const tabContents = document.querySelectorAll('.research-tab-content');
        if (tabBtns.length === 0 || tabContents.length === 0) return;

        const switchTab = (tabName) => {
            tabBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tabName);
            });
            tabContents.forEach(content => {
                content.classList.toggle('active', content.dataset.tab === tabName);
            });
        };

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                switchTab(btn.dataset.tab);
            });
        });

        // Intercept hash links to ensure tab switches before scroll target
        const handleHash = (hash, scrollSmooth = false) => {
            if (!hash) return;
            const decodedHash = decodeURIComponent(hash);
            let tabName = '';
            if (decodedHash.endsWith('#research_overview') || decodedHash.endsWith('#research')) {
                tabName = 'overview';
            } else if (decodedHash.endsWith('#research_solid_state')) {
                tabName = 'solid_state';
            } else if (decodedHash.endsWith('#research_ml')) {
                tabName = 'ml';
            } else if (decodedHash.endsWith('#research_semiconductor')) {
                tabName = 'semiconductor';
            }

            if (tabName) {
                switchTab(tabName);
                if (scrollSmooth) {
                    const researchSec = document.getElementById('research');
                    if (researchSec) {
                        const headerOffset = window.innerWidth > 1024 ? 100 : (window.innerWidth > 768 ? 80 : 65);
                        const elementPosition = researchSec.getBoundingClientRect().top + window.scrollY;
                        const offsetPosition = elementPosition - headerOffset;
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            }
        };

        // Check on load
        if (window.location.hash) {
            setTimeout(() => {
                handleHash(window.location.hash, true);
            }, 150);
        }

        // Listen for hash change
        window.addEventListener('hashchange', () => {
            handleHash(window.location.hash, true);
        });

        // Intercept clicks on links pointing to local hash tags
        document.querySelectorAll('a[href*="#research"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                const hashIndex = href.indexOf('#');
                if (hashIndex !== -1) {
                    const hash = href.substring(hashIndex);
                    const path = href.substring(0, hashIndex);
                    const isSamePage = !path || path === 'index.html' || window.location.pathname.endsWith(path) || window.location.pathname.endsWith('/');
                    if (isSamePage) {
                        e.preventDefault();
                        handleHash(hash, true);
                        history.pushState(null, null, hash);
                    }
                }
            });
        });

        // Click handler for overview summary cards
        const researchCards = document.querySelectorAll('#research_overview .research-item');
        const tabMapping = ['solid_state', 'ml', 'semiconductor'];
        researchCards.forEach((card, index) => {
            card.addEventListener('click', () => {
                if (index < tabMapping.length) {
                    const targetTab = tabMapping[index];
                    handleHash(`#research_${targetTab}`, true);
                    history.pushState(null, null, `#research_${targetTab}`);
                }
            });
        });

        // Intercept clicks on links pointing to other sections to reset the research tab to overview
        document.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes('#') && !href.includes('research')) {
                link.addEventListener('click', () => {
                    switchTab('overview');
                });
            }
        });
    };

    // ==========================================================================
    // 14. Hero Section Real-time Stats Auto-updating
    // ==========================================================================
    const initHeroStats = async () => {
        const pubStatEl = document.getElementById('hero-stat-publications');
        const memberStatEl = document.getElementById('hero-stat-members');
        if (!pubStatEl && !memberStatEl) return;

        if (pubStatEl) {
            try {
                let pubs = [];
                const storedPubs = localStorage.getItem('midas_publications');
                if (storedPubs) {
                    pubs = JSON.parse(storedPubs);
                }
                const res = await fetch(`data/publications.json?t=${Date.now()}`);
                if (res.ok) {
                    pubs = await res.json();
                    localStorage.setItem('midas_publications', JSON.stringify(pubs));
                }
                if (pubs && pubs.length > 0) {
                    pubStatEl.textContent = `${pubs.length}+`;
                }
            } catch (e) {
                console.warn("Failed to load publications count for hero stats:", e);
            }
        }

        if (memberStatEl) {
            try {
                let mems = [];
                const storedMembers = localStorage.getItem('midas_members');
                if (storedMembers) {
                    mems = JSON.parse(storedMembers);
                }
                const res = await fetch(`data/members.json?t=${Date.now()}`);
                if (res.ok) {
                    mems = await res.json();
                    localStorage.setItem('midas_members', JSON.stringify(mems));
                }
                if (mems && mems.length > 0) {
                    const activeMems = mems.filter(m => m.group !== 'alumni');
                    memberStatEl.textContent = `${activeMems.length}+`;
                }
            } catch (e) {
                console.warn("Failed to load members count for hero stats:", e);
            }
        }
    };

    // ==========================================================================
    // 15. Home News & Gallery Live Feeding
    // ==========================================================================
    const initHomeNewsGallery = async () => {
        const newsListEl = document.getElementById('home-news-list');
        const galleryGridEl = document.getElementById('home-gallery-grid');
        if (!newsListEl && !galleryGridEl) return;

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

        const resolveGitHubImage = (imgElement, path) => {
            if (!path) return;
            if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
                imgElement.src = path;
                return;
            }
            imgElement.src = path;

            const isLocal = 
                window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' || 
                window.location.hostname === '0.0.0.0' || 
                window.location.hostname === '[::1]' ||
                window.location.hostname.startsWith('192.168.') || 
                window.location.hostname.startsWith('10.') || 
                window.location.hostname.startsWith('172.16.') || 
                window.location.hostname.startsWith('172.17.') || 
                window.location.hostname.startsWith('172.18.') || 
                window.location.hostname.startsWith('172.19.') || 
                window.location.hostname.startsWith('172.2') || 
                window.location.hostname.startsWith('172.3') || 
                window.location.hostname.endsWith('.local') ||
                (window.location.port !== '' && window.location.port !== '80' && window.location.port !== '443');

            if (!isLocal && path.startsWith('data/images/')) {
                const handleImgError = () => {
                    imgElement.removeEventListener('error', handleImgError);
                    const { owner, repo } = getGitHubRepoDetails();
                    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}?t=${Date.now()}`;
                    console.log(`[Home Gallery] Image failed to load: ${path}. Fallback to GitHub Raw URL: ${rawUrl}`);
                    imgElement.src = rawUrl;
                };
                imgElement.addEventListener('error', handleImgError);
            }
        };

        const getImages = (post) => {
            if (!post.img) return [];
            if (Array.isArray(post.img)) return post.img.filter(Boolean);
            if (typeof post.img === 'string') {
                return post.img.split(',').map(s => s.trim()).filter(Boolean);
            }
            return [];
        };

        try {
            let posts = [];
            const cachedPosts = localStorage.getItem('midas_posts');
            if (cachedPosts) {
                try {
                    posts = JSON.parse(cachedPosts);
                } catch (parseErr) {
                    console.warn("Failed to parse cached posts:", parseErr);
                }
            }

            const res = await fetch(`data/posts.json?t=${Date.now()}`);
            if (res.ok) {
                posts = await res.json();
                localStorage.setItem('midas_posts', JSON.stringify(posts));
            }

            if (!posts || posts.length === 0) {
                if (newsListEl) newsListEl.innerHTML = '<div class="empty-placeholder">No news articles found.</div>';
                if (galleryGridEl) galleryGridEl.innerHTML = '<div class="empty-placeholder">No gallery images found.</div>';
                return;
            }

            const sortedPosts = posts.filter(p => p && p.date).sort((a, b) => new Date(b.date) - new Date(a.date));

            // Render News List (up to 5 items)
            if (newsListEl) {
                const newsPosts = sortedPosts.filter(p => p.category === 'news').slice(0, 5);
                if (newsPosts.length === 0) {
                    newsListEl.innerHTML = '<div class="empty-placeholder">No news articles found.</div>';
                } else {
                    newsListEl.innerHTML = '';
                    newsPosts.forEach(p => {
                        const images = getImages(p);
                        const representativeImg = images.length > 0 ? images[0] : 'images/logo.png';
                        
                        const cardLink = document.createElement('a');
                        cardLink.href = `post.html?id=${p.id}`;
                        cardLink.className = 'news-list-card';

                        const thumbWrapper = document.createElement('div');
                        thumbWrapper.className = 'news-list-thumb-wrapper';

                        const imgEl = document.createElement('img');
                        imgEl.className = 'news-list-thumb';
                        imgEl.alt = p.title;
                        resolveGitHubImage(imgEl, representativeImg);
                        thumbWrapper.appendChild(imgEl);

                        const infoDiv = document.createElement('div');
                        infoDiv.className = 'news-list-info';
                        infoDiv.innerHTML = `
                            <span class="news-list-title">${p.title}</span>
                            <span class="news-list-date">${p.date}</span>
                        `;

                        cardLink.appendChild(thumbWrapper);
                        cardLink.appendChild(infoDiv);
                        newsListEl.appendChild(cardLink);
                    });
                }
            }

            // Render Gallery Grid (up to 4 items)
            if (galleryGridEl) {
                const photoPosts = sortedPosts.filter(p => p.category === 'photo').slice(0, 4);
                if (photoPosts.length === 0) {
                    galleryGridEl.innerHTML = '<div class="empty-placeholder">No gallery images found.</div>';
                } else {
                    galleryGridEl.innerHTML = '';
                    photoPosts.forEach(p => {
                        const images = getImages(p);
                        const representativeImg = images.length > 0 ? images[0] : 'images/logo.png';
                        
                        const itemLink = document.createElement('a');
                        itemLink.href = `post.html?id=${p.id}`;
                        itemLink.className = 'gallery-item';

                        const imgEl = document.createElement('img');
                        imgEl.alt = p.title;
                        resolveGitHubImage(imgEl, representativeImg);

                        const infoDiv = document.createElement('div');
                        infoDiv.className = 'gallery-item-info';
                        infoDiv.innerHTML = `
                            <h3 class="gallery-item-title">${p.title}</h3>
                            <span class="gallery-item-date">${p.date}</span>
                        `;

                        itemLink.appendChild(imgEl);
                        itemLink.appendChild(infoDiv);
                        galleryGridEl.appendChild(itemLink);
                    });
                }
            }

        } catch (e) {
            console.error("Failed to load news & gallery for home page:", e);
            alert("Error in home.js news & gallery: " + e.message + "\nStack: " + e.stack);
            if (newsListEl) newsListEl.innerHTML = '<div class="empty-placeholder">Error loading news.</div>';
            if (galleryGridEl) galleryGridEl.innerHTML = '<div class="empty-placeholder">Error loading gallery.</div>';
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHomeModule);
    } else {
        initHomeModule();
    }
})();
