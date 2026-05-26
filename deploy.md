# MIDAS Lab 홈페이지 배포 가이드 (Deployment Guide)

이 프로젝트는 별도의 컴파일이나 빌드 단계가 필요 없는 **순수 정적 정적 파일(HTML, CSS, JS)**로 구성되어 있습니다. 따라서 무료 호스팅 서비스를 활용하여 쉽고 빠르게 배포할 수 있습니다. 가장 추천하는 두 가지 배포 방법을 안내합니다.

---

## 방법 1. GitHub Pages로 무료 배포하기 (가장 추천)

GitHub 리포지토리를 만들어 코드를 올리는 것만으로 즉시 배포할 수 있습니다.

### 1단계: Git 저장소 초기화 및 커밋
로컬 터미널에서 다음 명령을 실행하여 `homepage` 폴더 내의 코드를 버전 관리 시스템에 추가합니다.

```bash
cd /home/yoonwoo/homepage
git init
git add .
git commit -m "feat: init MIDAS Lab homepage"
```

### 2단계: GitHub 저장소 생성 및 연결
1. [GitHub](https://github.com/)에 로그인하고 새로운 퍼블릭 저장소(Public Repository)를 생성합니다. (예: `midas-lab-home`)
2. 생성된 저장소 주소를 로컬 저장소에 연결하고 푸시합니다.

```bash
git branch -M main
git remote add origin https://github.com/사용자아이디/저장소이름.git
git push -u origin main
```

### 3단계: Pages 활성화
1. GitHub 웹사이트의 해당 저장소로 이동합니다.
2. 상단 탭에서 **Settings** -> 좌측 메뉴에서 **Pages**를 클릭합니다.
3. **Build and deployment** 섹션의 **Source**를 `Deploy from a branch`로 설정합니다.
4. **Branch**를 `main` (혹은 코드가 푸시된 브랜치), 폴더를 `/ (root)`로 지정한 뒤 **Save**를 누릅니다.
5. 약 1~2분 후 페이지 상단에 배포 완료 링크가 생성됩니다. (예: `https://사용자아이디.github.io/저장소이름/`)

---

## 방법 2. Netlify로 배포하기 (현재 사용 중인 방식)

Netlify 대시보드에서 `homepage` 폴더를 드래그 앤 드롭하는 것만으로 배포할 수 있어 가장 간편합니다.

### 1단계: Netlify 로그인 및 빌드 없음 설정
1. [Netlify](https://www.netlify.com/)에 로그인합니다.
2. 대시보드 우측 상단의 **Add new site** -> **Deploy manually**를 클릭합니다.

### 2단계: 폴더 업로드
1. 화면에 표시되는 드래그 앤 드롭 영역에 로컬 파일 탐색기를 열어 `/home/yoonwoo/homepage` 폴더를 통째로 끌어다 놓습니다.
2. 5초 내로 사이트가 라이브 상태가 되며 임시 도메인이 생성됩니다.

### 3단계: 기존 도메인 연결 (https://midas-cau.netlify.app/)
1. 생성된 사이트의 **Site settings** -> **Domain management**로 이동합니다.
2. 기존에 사용 중인 `midas-cau.netlify.app` 도메인을 이곳으로 이관 또는 연결 설정합니다. (기존 사이트를 지우고 새 사이트의 Name을 `midas-cau`로 설정하는 방식으로 진행할 수 있습니다.)

---

## 정적 사이트 보안 권장 사항 (TODO-security)
- **HTTPS 자동 적용**: GitHub Pages와 Netlify 모두 기본적으로 SSL 인증서(HTTPS)를 제공하므로, 항상 안전한 암호화 프로토콜이 적용된 도메인 주소로 공유하시기 바랍니다.
- **CSP 헤더**: 배포 서비스의 설정 파일(예: Netlify의 `netlify.toml` 또는 `_headers` 파일)을 통해 엄격한 Content Security Policy를 전달하도록 추가 설정을 하시면 보안성이 극대화됩니다.
