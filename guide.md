# MIDAS 연구실 웹사이트 구성원(Members) 관리 및 웹 서버 운영 가이드

본 문서는 MIDAS 연구실 웹사이트의 구성원 데이터 관리 구조, 이미지 업로드 규칙, 신규 구성원 추가 방법 및 로컬 개발 서버 실행 방법에 대해 설명합니다.

---

## 1. 구성원(Members) 관리 구조

웹사이트 내 구성원 정보는 HTML 마크다운과 JavaScript 데이터를 결합하여 표시됩니다.

1. **화면 표시 및 기본 인적사항 (`index.html`)**
   - 각 구성원의 직함, 이메일, 연구 키워드 등은 `index.html` 내의 `.people-grid` 영역에 HTML 태그로 직접 작성되어 있습니다.
   - 각 구성원 요소는 `<div class="item" data-member-id="member-id">`와 같이 고유한 `data-member-id` 속성을 가집니다.

2. **상세 학력 데이터 (`app.js`)**
   - 구성원 카드를 클릭했을 때 나타나는 모달 팝업의 학력(Education) 정보는 `app.js` 파일 내의 `educationData` 객체에 저장되어 있습니다.
   - `index.html`에 정의된 `data-member-id`가 `educationData` 객체의 키(Key)와 매칭됩니다.

---

## 2. 구성원 사진 등록 및 이미지 매핑 규칙

### 📷 이미지 업로드 규칙
- **저장 디렉토리**: `/home/yoonwoo/homepage/images/people/`
- **파일명 형식**: `[member-id].jpg`
  - 예: 김대현 학생의 `data-member-id`가 `daehyun-kim`인 경우, 사진 파일명은 반드시 **`daehyun-kim.jpg`**여야 합니다.
  - 대소문자 및 특수기호(하이픈 등)가 정확히 일치해야 웹브라우저에서 올바르게 인식됩니다.
- **권장 포맷 및 크기**: `.jpg` (또는 `.jpeg`) 형식을 권장하며, 가로세로 비율이 1:1인 정방형 이미지(예: 300x300px ~ 500x500px)를 사용하시는 것이 좋습니다. (가로 100%, 세로 250px 고정 크기로 정방형에 가까운 비율이 적용됩니다.)

### 🔄 이미지 로드 실패 시 대체 처리 (Fallback)
사진을 아직 등록하지 않았거나 경로가 맞지 않아 이미지를 불러오지 못하더라도 레이아웃이 깨지지 않도록 아래와 같은 대체(Fallback) 메커니즘이 구현되어 있습니다:
- HTML 소스 내 `onerror` 이벤트 리스너가 이미지 로드 실패를 감지합니다.
- 사진이 없을 경우 이미지는 자동으로 숨겨지고, 미리 설정된 영문 이니셜(예: DK, JS)을 배경색과 함께 보여주는 **둥근 아바타 플레이스홀더(`.avatar-placeholder`)**가 화면에 표시됩니다.
- 사진이 정상적으로 업로드되면 플레이스홀더는 자동으로 숨겨지고 실제 사진이 부드럽게 노출됩니다.

---

## 3. 신규 구성원 추가 절차 (Step-by-Step)

새로운 연구실 구성원을 홈페이지에 등록하려면 다음 3단계를 수행하십시오.

### Step 1. `index.html` 파일 수정
해당하는 그룹 (Ph.D., M.S., Undergraduate, Alumni)의 `people-grid` 내부에 새로운 구성원 블록을 복사하여 붙여넣고 정보를 수정합니다.

```html
<!-- 예시 1: 신규 석사 과정 학생 추가 -->
<div class="item" data-member-id="gildong-hong">
    <div class="pro_img">
        <!-- 1. 이미지 경로 설정 (gildong-hong.jpg) -->
        <img src="images/people/gildong-hong.jpg" alt="Gildong Hong" class="member-photo" 
             onload="this.style.display='block'; if(this.nextElementSibling) this.nextElementSibling.style.display='none';" 
             onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" 
             style="display: none; width: 100%; height: 100%; object-fit: cover;">
        <!-- 2. 대체 텍스트(이니셜) 설정 -->
        <div class="avatar-placeholder">GH</div>
    </div>
    <div class="pro_info">
        <div class="pro_name">
            <span class="ko_name">홍길동</span>
            <span class="en_name">Gildong Hong</span>
        </div>
        <div class="pro_sub">M.S. Student</div>
        <div class="pro_sub_txt">Artificial Intelligence & Battery</div>
        <ul>
            <li>gildong@cau.ac.kr</li>
        </ul>
        <div class="edu_wrap">
            <p>Education</p>
        </div>
    </div>
</div>

<!-- 예시 2: 신규 동문(Alumni) 추가 시 (현재 직장/직위 포함) -->
<div class="item" data-member-id="gildong-hong-alumni">
    <div class="pro_img">
        <img src="images/people/gildong-hong-alumni.jpg" alt="Gildong Hong" class="member-photo" 
             onload="this.style.display='block'; if(this.nextElementSibling) this.nextElementSibling.style.display='none';" 
             onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" 
             style="display: none; width: 100%; height: 100%; object-fit: cover;">
        <div class="avatar-placeholder">GH</div>
    </div>
    <div class="pro_info">
        <div class="pro_name">
            <span class="ko_name">홍길동</span>
            <span class="en_name">Gildong Hong</span>
        </div>
        <div class="pro_sub">Alumni</div>
        <div class="pro_sub_txt">Ca Batteries</div>
        <!-- 동문 전용: 현재 근무지 / 직위 입력 -->
        <div class="pro_current">Current: LG Energy Solution</div>
        <div class="edu_wrap">
            <p>Education</p>
        </div>
    </div>
</div>
```

### Step 2. `app.js` 파일 수정
`app.js` 파일의 `educationData` 객체에 신규 구성원의 학력 정보를 추가합니다. 키 이름은 `index.html`에서 정의한 `data-member-id`와 반드시 동일해야 합니다.

```javascript
const educationData = {
    // ... 기존 구성원 데이터 ...
    
    // 신규 구성원 추가 예시
    "gildong-hong": {
        name: "홍길동 (Gildong Hong)",
        education: [
            { degree: "M.S. Student in Nanotechnology", detail: "Chung-Ang University (2026 - Present)" },
            { degree: "B.S. in Integrative Engineering", detail: "Chung-Ang University (2026)" }
        ]
    }
};
```

### Step 3. 이미지 파일 업로드
- 촬영한 사진 파일명을 `gildong-hong.jpg`로 변경합니다.
- 사진을 `/home/yoonwoo/homepage/images/people/` 폴더에 복사/업로드합니다.

---

## 4. 로컬 웹 서버 실행 및 확인 방법

현재 로컬 개발 및 테스트를 위한 웹 서버가 백그라운드에서 정상 동작 중입니다.

* **접속 주소**: [http://localhost:8000](http://localhost:8000) 또는 [http://127.0.0.1:8000](http://127.0.0.1:8000)
* **현재 백그라운드 서버 상태**: `python3 -m http.server 8000 --bind 127.0.0.1`이 실행 중입니다.

### 💡 유용한 팁 (캐시 무효화)
새로운 사진을 업로드했는데도 웹브라우저에서 예전 플레이스홀더나 이전 이미지가 계속 보인다면, 브라우저 캐시 때문일 수 있습니다.
이 경우 아래 방법 중 하나를 시도하세요:
1. **강제 새로고침**: `Ctrl + F5` (Windows) 또는 `Cmd + Shift + R` (Mac)
2. **캐시 우회 쿼리스트링 사용**: `index.html`에서 이미지 경로 뒤에 버전 식별자(예: `src="images/people/daehyun-kim.jpg?v=1"`)를 붙여서 브라우저가 새 이미지를 강제로 받아오도록 설정할 수 있습니다.
