/**
 * MIDAS Lab Homepage - People Page (people.html) Specialized Modules
 * Version: 50
 */

(() => {
    // Check if we are on the people page
    const hasPeopleElements = document.getElementById('phdGrid') || document.getElementById('alumniGrid') || document.querySelector('.people-tab-btn');
    if (!hasPeopleElements) return;

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
        const isRebuilding = (Date.now() - lastSync) < 120000;

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

        // Migrate emails
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
    };

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

    const phdGrid = document.getElementById('phdGrid');
    const msGrid = document.getElementById('msGrid');
    const undergraduateGrid = document.getElementById('undergraduateGrid');
    const alumniGrid = document.getElementById('alumniGrid');

    const renderMembers = () => {
        if (!phdGrid && !msGrid && !undergraduateGrid && !alumniGrid) return;

        if (phdGrid) phdGrid.replaceChildren();
        if (msGrid) msGrid.replaceChildren();
        if (undergraduateGrid) undergraduateGrid.replaceChildren();
        if (alumniGrid) alumniGrid.replaceChildren();

        members.forEach(member => {
            const card = document.createElement('div');
            card.className = 'item';
            card.setAttribute('data-member-id', member.id);

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

                const emailLink = document.createElement('a');
                emailLink.className = 'member-email-btn';
                emailLink.href = `mailto:${member.email}`;
                emailLink.title = '이메일 보내기';
                emailLink.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="email-icon">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                `;

                emailLink.addEventListener('click', (e) => {
                    e.stopPropagation();
                });

                emailItem.appendChild(emailLink);
                emailList.appendChild(emailItem);
                proInfo.appendChild(emailList);
            }

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

            card.addEventListener('click', () => {
                openEducationModal(member.id);
            });

            if (img.complete) {
                img.onload();
            }

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
        addEduRow();
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
        idField.disabled = true;

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

    const idField = document.getElementById('memberId');
    const imgField = document.getElementById('memberImg');
    if (idField && imgField) {
        idField.addEventListener('input', () => {
            const cleanId = idField.value.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '');
            imgField.value = cleanId ? cleanId + '.jpg' : '';
        });
    }

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

                const photoFile = memberPhotoFile ? memberPhotoFile.files[0] : null;
                if (photoFile) {
                    const compressedData = await resizeAndCompressMemberImage(photoFile);
                    
                    const uploadRes = await fetch('/api/upload-member-photo', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename: imgVal, image: compressedData })
                    });
                    
                    if (!uploadRes.ok) {
                        throw new Error('사진 업로드에 실패했습니다. 서버 상태를 확인해주세요.');
                    }
                }

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
                    const idx = members.findIndex(m => m.id === idOld);
                    if (idx > -1) members[idx] = newMember;
                } else {
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
    // 12. People Section Tab Toggle Logic
    // ==========================================================================
    const initPeopleTabs = () => {
        const tabBtns = document.querySelectorAll('.people-tab-btn');
        const tabContents = document.querySelectorAll('.people-tab-content');
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

        const handleHash = (hash) => {
            if (!hash) return;
            const decodedHash = decodeURIComponent(hash);
            if (decodedHash.endsWith('#alumni')) {
                switchTab('alumni');
            } else if (decodedHash.endsWith('#members')) {
                switchTab('members');
            }
        };

        switchTab('members');

        if (window.location.hash) {
            handleHash(window.location.hash);
        }

        window.addEventListener('hashchange', () => {
            handleHash(window.location.hash);
        });

        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', () => {
                const href = link.getAttribute('href');
                handleHash(href);
            });
        });
    };

    // Expose closeMemberModal globally for Escape key listener in main.js
    window.closeMemberModal = closeMemberModal;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initMembers();
            initPeopleTabs();
        });
    } else {
        initMembers();
        initPeopleTabs();
    }
})();
