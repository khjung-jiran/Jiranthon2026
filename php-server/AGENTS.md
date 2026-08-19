# 이음 PHP 서버 — 개발 가이드

## 서버 실행

```bash
cd php-server
php -S 0.0.0.0:8000 -t public public/router.php
```

> **주의**: 반드시 `public/router.php` 라우터 스크립트를 사용해야 함.
> `php -S 0.0.0.0:8000 -t public` 만 쓰면 `/app` 요청이 `public/app/index.html` 정적 파일로 직접 응답해서 Twig 템플릿이 무시됨.

## 접속 주소

- **로그인**: `http://<IP>:8000/login`
- **회원가입**: `http://<IP>:8000/signup` (예정)
- **앱(Expo 웹 빌드)**: `http://<IP>:8000/app`
- **API**: `http://<IP>:8000/api/...`

## 기술 스택

- PHP 8.x + Slim 4 + Twig 3
- SQLite (eum.db)
- 정적 CSS: `public/css/eium.css` (todo-reference에서 복사한 통합 스타일시트)

## 템플릿 작성 규칙 (중요)

### base.html.twig 구조

모든 페이지 템플릿은 `base.html.twig`를 상속한다.

```twig
{% extends 'base.html.twig' %}

{% block title %}페이지 제목{% endblock %}

{% block content %}
<!-- 여기에 페이지 내용 -->
{% endblock %}

{% block scripts %}
<script>
// 페이지 전용 JavaScript
</script>
{% endblock %}
```

### 모바일 WebView 대응 (핵심)

`base.html.twig`가 아래 구조를 제공한다. 이 구조를 깨지 말 것:

1. **`#root`**: `width:100%; max-width:390px` (작은 화면에서 100% 대응, 큰 화면에서 390px 중앙 정렬), `--app-height` CSS 변수로 실제 화면 높이 적용
2. **JavaScript `setAppHeight()`**: `window.innerHeight`를 `--app-height`에 주입. resize/orientationchange 대응
3. **CSS 캐시 방지**: `eium.css?v={{ 'now'|date('U') }}` 타임스탬프 쿼리스트링

### eium.css의 `.app` 클래스

```css
.app{
  position:relative;
  display:flex;
  flex-direction:column;
  width:100%;
  min-height:100vh;
  min-height:var(--app-height,100vh);
  background:var(--c-bg);
}
#root > .app{ min-height:inherit; }
```

- `height: 100%` 사용 금지 → 모바일 WebView에서 부모 높이가 안 잡혀 0이 됨
- `overflow: hidden` 사용 금지 → 콘텐츠가 잘려서 빈 화면이 됨
- `flex: 1` 사용 금지 → `#root`가 flex 컨테이너가 아니므로 동작 안 함
- `min-height: var(--app-height, 100vh)` 로 화면 전체 채우기

### 페이지 템플릿 패턴

```twig
{% extends 'base.html.twig' %}
{% block title %}이음 · 페이지명{% endblock %}
{% block content %}
<main class="app 페이지클래스">
  <!-- 콘텐츠 -->
</main>
{% endblock %}
```

- `<main class="app login">` 처럼 `.app` + 페이지 클래스 조합
- eium.css의 페이지별 클래스(`.login`, `.signup`, `.home` 등) 사용
- 인라인 `style`로 `flex:1` 등을 덮어쓰지 말 것

### 캐시

- Twig 템플릿 캐시: 비활성화 (`cache: false, auto_reload: true`)
- 정적 파일: `Cache-Control: no-store, no-cache, must-revalidate`
- CSS: 타임스탬프 쿼리스트링으로 캐시 방지

## 참고 디자인

- `templates/todo-reference/` — 원본 디자인 명세 (수정 금지, 참고만)
- `templates/todo-reference/css/eium.css` — 원본 CSS (이걸 `public/css/eium.css`로 복사해서 사용)
- `templates/todo-reference/pages/*.html` — 화면별 HTML 명세

## 현재 구현된 페이지

| 경로 | 템플릿 | 상태 |
|------|--------|------|
| `/login` | `login.html.twig` | 완료 (참고: `01-login.html`) |
| `/auth?role=parent` | `auth.html.twig` | 구버전 (재작성 예정) |
| `/auth?role=child` | `auth.html.twig` | 구버전 (재작성 예정) |
| `/app` | `app.html.twig` | Expo 웹 빌드 |
| `/` | `home.html.twig` | 서버 정보 |
| `/story-child` | `story_child.html.twig` | 완료 (이야기 자녀모드) |
| `/album` | `album.html.twig` | 완료 (앨범) |
| `/calendar` | `calendar.html.twig` | 완료 (캘린더) |
| `/debug` | `debug.html.twig` | 디버그용 |
| `/debug2` | `debug2.html.twig` | 디버그용 (base 없음) |
| `/debug3` | `debug3.html.twig` | 디버그용 (base 있음, .app 없음) |

## 예시 데이터 포맷 (참고용 — 템플릿에서는 제거됨)

### 홈 (home_child)
```html
<!-- 인사 -->
<div class="home__date">7월 11일 금요일</div>
<h1 class="home__greet">안녕하세요, 지훈님</h1>
<div class="home__link-text">어머니 · 아버지와 연결되어 있어요</div>

<!-- 퀵 액션 -->
<div class="quick__title">도착한 답변 <span class="quick__count">1</span></div>
<div class="quick__sub">어머니의 목소리가 왔어요</div>

<!-- 질문 카드 덱 -->
<span class="pill pill--primary">3</span>  <!-- 도착한 질문 수 -->
<div class="deck__back-1">
  <span class="pill pill--tag">수민 (동생)</span>
  <div class="deck__back-title">어머니가 제일 좋아하시는 노래가 뭔지 물어봐 줘</div>
</div>
<article class="deck__card">
  <span class="deck__from">AI 이음이 제안</span>
  <span class="deck__time">오늘 오전</span>
  <div class="deck__q">아버지의 첫 출근날, 어떤 기분이셨을지 여쭤보세요</div>
  <div class="deck__sub">일대기 '청년기' 챕터를 채울 수 있는 질문이에요</div>
</article>
```

### 이야기 (story_child)
```html
<!-- 단편집 카드 -->
<a class="scard">
  <span class="pill pill--tag-warm">음성 답변</span>  <!-- 또는 pill--tag-green -->
  <span class="scard__meta">7월 8일 · 4분 분량</span>
  <div class="scard__title">1974년, 아버지의 첫 출근날</div>
  <p class="scard__preview">새벽 다섯 시, 어머니가…</p>
</a>

<!-- 일대기 -->
<div class="life__banner">
  <div class="life__banner-kicker">어머니의 일대기</div>
  <div class="life__banner-title">아직 채워지지 않은 장이 4개 남아 있어요</div>
</div>
```

### 앨범 (album)
```html
<figure class="photo photo--hero">
  <div class="photo__flag">
    <span class="diamond diamond--sm"></span>
    <span class="photo__flag-text">이 사진으로 질문이 만들어졌어요</span>
  </div>
  <figcaption class="photo__caption">
    <div class="photo__caption-title">1982년 봄, 창경원 나들이</div>
    <div class="photo__caption-sub">아버지 앨범에서 · 지난주</div>
  </figcaption>
  <div class="photo__reacts">
    <button class="react">🥹 2</button>
    <button class="react react--mine">❤️ 5</button>
  </div>
</figure>
```

### 캘린더 (calendar)
```html
<h1 class="cal__title">2026년 7월</h1>
<!-- 달력: 일정 있는 날에 점 -->
<div class="cal__day">2<span class="cal__day-dot cal__day-dot--green"></span></div>
<div class="cal__day cal__day--today">11</div>

<!-- 일정 -->
<article class="event">
  <div class="event__date event__date--warm">
    <span class="event__mo">7월</span>
    <span class="event__day">24</span>
  </div>
  <div class="event__title">아버지 생신</div>
  <div class="event__sub">2주 뒤 · 온 가족 저녁 식사</div>
  <span class="pill pill--dday">D-13</span>
</article>
```

### 설정 (settings)
```html
<span class="avatar avatar--warm avatar--xl">지</span>
<div class="srow__name">지훈</div>
<div class="srow__sub">자녀 모드 · 어머니, 아버지와 연결됨</div>
```

## API 엔드포인트 (인증 관련)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/families` | 가족 생성 |
| POST | `/api/families/join?invite_code=XXX` | 초대코드로 가족 참여 |
| POST | `/api/members` | 멤버 생성 |
| POST | `/api/auth/login` | 로그인 |
