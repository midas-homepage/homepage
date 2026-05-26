# MIDAS Lab 홈페이지 디자인 개선 및 기능 업데이트 구현 계획서

본 구현 계획서는 GNB 줄바꿈 수정, 헤더 로고 텍스트("MIDAS") 추가, 논문 PDF 첨부 필드 동적 연동, 구성원 사진 자동 로드 및 대체 이미지 처리, 윤원우 학생 카드의 강조 효과 제거, 그리고 연구 분야 이미지 및 아이콘 개선에 대한 상세 내용을 담고 있습니다.

## 사용자 검토 필요 사항

> [!IMPORTANT]
> **1. 헤더 로고 텍스트("MIDAS") 브랜딩 적용**
> 모든 페이지의 헤더 영역에서 그래픽 로고 아이콘 옆에 "MIDAS" 텍스트를 Montserrat 서체(Thin/Light 두께)로 적용합니다. 이는 arlab.cau.ac.kr 레이아웃과 일치하는 구성입니다.
>
> **2. 구성원 프로필 사진 자동 로딩 및 폴백(Fallback) 처리**
> 교수님 및 학생 프로필 카드에서 `images/people/[member-id].jpg` 파일이 존재하는 경우 자동으로 사진을 로드하고, 이미지 파일이 없는 경우에는 깨진 이미지 엑스박스 없이 이니셜이 포함된 SVG 기본 자리표시자(Placeholder)가 매끄럽게 표시되도록 구성합니다.
>
> **3. 연구 분야 실제 이미지 및 직관적인 아이콘 적용**
> 기존의 임시 AI 생성 이미지를 전량 삭제하고, 연구실 실정에 맞는 실제 연구 분야 사진들로 매핑하였습니다. 또한 각 카드 상단에 노출되는 그래픽 아이콘들을 배터리(배터리 팩), 머신러닝(뇌), 반도체(칩) 형태의 직관적인 디자인으로 전면 교체합니다.

---

## 변경 항목 세부 내용

### GNB 레이아웃 및 서체 스타일 수정

#### [MODIFY] [styles.css](file:///home/yoonwoo/homepage/styles.css)
- **헤더 로고 영역 구조 변경**: `#header h1 a`를 flexbox 컨테이너로 설정하여 로고 이미지와 글자 로고가 나란히 수평 배치되도록 수정합니다. 로고 텍스트 `.logo-text`에 Montserrat 폰트를 적용하고 대문자 변환 및 간격 조정을 진행합니다. (스크롤 시 상단 고정 상태일 때의 스타일도 개별 정의)
- **GNB 줄바꿈 차단**: 드롭다운 메뉴 내의 "PI & Members" 항목 등이 화면 가로폭에 따라 줄바꿈이 일어나지 않도록 `#cssmenu ul ul li a`에 `display: block;` 및 `white-space: nowrap;` 속성을 부여합니다.
- **PDF 다운로드 버튼 스타일링**: 논문 목록에 렌더링될 `.pub-btn.btn-pdf` 버튼을 위한 스타일을 추가하고 빨간색 톤의 호버 애니메이션을 적용해 파란색 DOI 버튼과 구분되도록 합니다.

### 논문 동적 PDF 링크 연동

#### [MODIFY] [app.js](file:///home/yoonwoo/homepage/app.js)
- **논문 데이터 구조 보완**: `publications` 데이터 배열 각 항목에 `pdf: ""` 속성을 추가하여 PDF 파일이 업로드되는 대로 동적으로 경로를 지정할 수 있도록 구조화합니다.
- **DOM 렌더링 로직 수정**: `renderPublications()` 함수에서 `pub.pdf` 경로가 존재할 경우에만 DOI 버튼 옆에 "PDF" 버튼을 렌더링하도록 돔 조작 코드를 추가합니다.

### 구성원 프로필 그리드 및 강조 제거

#### [MODIFY] [people.html](file:///home/yoonwoo/homepage/people.html)
- **교수님 프로필**: `images/people/haesun_park.jpg`가 있으면 로드하고 로드 실패 시 `images/logo.png`가 로드되도록 `onerror` 폴백 처리를 진행합니다.
- **학생 프로필 목록**:
  - 개별 학생 사진 파일 `images/people/[member-id].jpg` 링크를 `<img>` 태그로 삽입합니다.
  - 이미지 로드 완료 시에는 이미지가 드러나고, 파일이 없어 오류가 발생할 시에는 `display: none;` 처리 후 기본 아바타 SVG가 보여지도록 `onload`/`onerror` 인라인 핸들러를 구성합니다.
  - 윤원우 학생 카드에 적용되어 있던 `highlight-member` 클래스를 제거하여 다른 학생들과 동일한 일반 카드로 변경합니다.

### 헤더 로고 디자인 다른 페이지 반영

#### [MODIFY] [index.html](file:///home/yoonwoo/homepage/index.html)
#### [MODIFY] [research.html](file:///home/yoonwoo/homepage/research.html)
#### [MODIFY] [contact.html](file:///home/yoonwoo/homepage/contact.html)
- 각 페이지의 `#header` 내 로고 영역 구조를 수정하여 `<span class="logo-text">MIDAS</span>`가 아이콘 우측에 정상적으로 나타나도록 적용합니다.

### 연구 분야(Research Interests) 이미지 및 아이콘 교체

#### [MODIFY] [index.html](file:///home/yoonwoo/homepage/index.html)
- **실제 연구 이미지 매핑**:
  - Solid-state Batteries -> `images/research/solid_state_battery.jpg` (리튬 금속과 원통형 배터리 이미지)
  - Multivalent Batteries -> `images/research/multivalent_battery.png` (파란색 미래형 에너지 셀 그래픽)
  - Machine Learning -> `images/research/machine_learning.jpg` (AI 문구와 뇌 그래픽)
  - Semiconductor Process & Discovery -> `images/research/semiconductor_process.jpg` (반도체 칩 이미지)
- **직관적인 SVG 아이콘 교체**:
  - **전고체 배터리**: 번개 모양이 포함된 배터리 충전 아이콘
  - **다가 배터리**: 3칸 충전 상태 표시 배터리 아이콘
  - **머신러닝**: 지능형 연산을 시각화한 브레인(Brain) 아이콘
  - **반도체 공정**: CPU 마이크로칩 모양의 칩 아이콘

---

## 검증 계획

### 수동 기능 검증
- 로컬 웹 서버를 기동하여 변경 내용들을 화면에서 직접 확인합니다:
  - GNB 드롭다운 항목이 한 줄로 깨지지 않고 올바르게 나타나는지 확인합니다.
  - 헤더 영역 좌측 상단 로고 이미지 바로 옆에 "MIDAS" 텍스트 브랜딩이 잘 노출되는지 확인합니다.
  - 윤원우 학생 프로필 카드의 강조 테두리와 표시가 사라졌는지 확인합니다.
  - `publications.json`이나 `app.js`에서 특정 논문에 pdf 파일 경로를 지정했을 때 PDF 버튼이 정상 노출되는지 확인합니다.
  - 프로필 이미지 파일이 없어도 프로필 페이지에 이미지 깨짐 현상 없이 기본 이니셜 아바타가 표시되는지 확인합니다.
  - 연구 분야(Research Interests) 섹션의 이미지들이 모두 전고체 배터리, 다가 배터리, 머신러닝, 반도체 공정에 맞는 실제 이미지로 노출되고 아이콘들이 알맞게 변경되었는지 확인합니다.
