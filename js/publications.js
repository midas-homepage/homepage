/**
 * MIDAS Lab Homepage - Publications Page (publications.html) Specialized Modules
 * Version: 64
 */

(() => {
    const pubListContainer = document.getElementById('pub-list-container');
    const searchInput = document.getElementById('pub-search-input');
    const filterYear = document.getElementById('pub-filter-year');
    const filterType = document.getElementById('pub-filter-type');
    const addPubBtn = document.getElementById('addPubBtn');

    if (!pubListContainer) return;

    let publications = [];
    let members = [];

    // Load members from localStorage / data/members.json to highlight them in the author list
    const loadMembers = async () => {
        const storedMembers = localStorage.getItem('midas_members');
        if (storedMembers) {
            try {
                members = JSON.parse(storedMembers);
            } catch (e) {
                console.error("Failed to parse stored members for highlight:", e);
            }
        }
        try {
            const response = await fetch(`data/members.json?t=${Date.now()}`);
            if (response.ok) {
                members = await response.json();
                localStorage.setItem('midas_members', JSON.stringify(members));
            }
        } catch (err) {
            console.warn("Failed to fetch members.json for highlight:", err);
        }
    };

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

    const saveFileToGitHub = async (path, contentString, commitMessage, isBase64 = false) => {
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
        
        let base64Content = "";
        if (isBase64) {
            base64Content = contentString;
        } else {
            const utf8Bytes = new TextEncoder().encode(contentString);
            let binaryString = "";
            const chunkSize = 0xffff;
            for (let i = 0; i < utf8Bytes.length; i += chunkSize) {
                binaryString += String.fromCharCode.apply(null, utf8Bytes.subarray(i, i + chunkSize));
            }
            base64Content = btoa(binaryString);
        }
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

        // Render in reverse order so newest is at the top of the UI
        [...items].reverse().forEach((pub) => {
            const originalIndex = publications.indexOf(pub);

            const article = document.createElement('article');
            article.className = 'pub-item glass-panel';
            article.setAttribute('data-year', pub.year);
            article.setAttribute('data-status', pub.status);

            const badge = document.createElement('div');
            badge.className = 'pub-year-badge';

            const pubNum = document.createElement('span');
            pubNum.className = 'pub-num';
            pubNum.textContent = `#${originalIndex + 1}`;

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

    const initPublications = async () => {
        await loadMembers();
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

    const pubEditModal = document.getElementById('pubEditModal');
    const pubEditForm = document.getElementById('pubEditForm');
    const pubModalTitle = document.getElementById('pubModalTitle');
    const closePubModalBtn = document.getElementById('closePubModalBtn');
    const cancelPubBtn = document.getElementById('cancelPubBtn');

    const openPubEditModal = (pub, index) => {
        if (!pubEditModal || !pubEditForm) return;

        const fileInput = document.getElementById('pubPdfFile');
        if (fileInput) fileInput.value = '';

        const statusDiv = document.getElementById('pdfUploadStatus');
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
            
            const pdfPath = pub.pdf || '';
            document.getElementById('pubPdf').value = pdfPath;
            if (statusDiv) {
                statusDiv.style.color = pdfPath ? '#38a169' : 'var(--text-muted)';
                statusDiv.textContent = pdfPath ? `현재 파일: ${pdfPath.split('/').pop()}` : '등록된 파일 없음';
            }
        } else {
            pubModalTitle.textContent = 'Add New Publication';
            pubEditForm.reset();
            document.getElementById('editPubIndex').value = '';
            if (statusDiv) {
                statusDiv.style.color = 'var(--text-muted)';
                statusDiv.textContent = '등록된 파일 없음';
            }
        }
        pubEditModal.classList.add('active');
    };

    if (addPubBtn) {
        addPubBtn.addEventListener('click', () => {
            openPubEditModal(null, null);
        });
    }

    const uploadPubPdfBtn = document.getElementById('uploadPubPdfBtn');
    const pubPdfFileInput = document.getElementById('pubPdfFile');
    const pdfUploadStatus = document.getElementById('pdfUploadStatus');
    const pubPdfInput = document.getElementById('pubPdf');

    if (uploadPubPdfBtn && pubPdfFileInput) {
        uploadPubPdfBtn.addEventListener('click', () => {
            pubPdfFileInput.click();
        });

        pubPdfFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                alert('PDF 파일만 업로드할 수 있습니다.');
                pubPdfFileInput.value = '';
                return;
            }

            const maxSize = 15 * 1024 * 1024;
            if (file.size > maxSize) {
                alert('파일 크기는 최대 15MB까지 가능합니다.');
                pubPdfFileInput.value = '';
                return;
            }

            if (pdfUploadStatus) {
                pdfUploadStatus.style.color = 'var(--text-muted)';
                pdfUploadStatus.textContent = '업로드 중...';
            }

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async (event) => {
                try {
                    const dataUrl = event.target.result;
                    const base64Data = dataUrl.split(',')[1];
                    const sanitizedName = file.name.toLowerCase()
                        .replace(/[^a-z0-9.]/g, '_')
                        .replace(/_+/g, '_');

                    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                    const targetPath = `data/publications/${sanitizedName}`;

                    if (isLocal) {
                        const response = await fetch('/api/upload-pub-pdf', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filename: sanitizedName, pdf: base64Data })
                        });

                        if (!response.ok) throw new Error('서버 업로드 실패');
                    } else {
                        await saveFileToGitHub(targetPath, base64Data, `Upload PDF: ${file.name}`, true);
                    }

                    if (pubPdfInput) pubPdfInput.value = targetPath;

                    if (pdfUploadStatus) {
                        pdfUploadStatus.style.color = '#38a169';
                        pdfUploadStatus.textContent = `업로드 완료: ${sanitizedName}`;
                    }
                } catch (err) {
                    console.error('PDF upload error:', err);
                    if (pdfUploadStatus) {
                        pdfUploadStatus.style.color = '#e53e3e';
                        pdfUploadStatus.textContent = `업로드 실패: ${err.message}`;
                    }
                    alert('PDF 업로드에 실패했습니다: ' + err.message);
                }
            };
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
                publications[parseInt(index)] = newPub;
            } else {
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

    window.closePubModal = closePubModal;

    // Export list render function globally so people.js can call it if needed
    window.renderPublicationsList = renderPublicationsList;
    window.publications = publications;
})();
