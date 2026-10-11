# HAR Share

[English](README.md) · [한국어](README.ko.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Español](README.es.md)

HAR를 공유하기 전에 최소한의 네트워크 기록으로 다시 만듭니다. 헤더·쿠키·본문·쿼리 이름과 값·실제 주소·확장 필드는 새 파일에 넣지 않습니다.

[사용해 보기](https://jeffrog-256k1.github.io/har-share/) · [MIT](LICENSE) · [Changelog](CHANGELOG.md)

![HAR Share](assets/preview.png)

## 로컬 실행

Node.js 22.12+ · npm

```sh
git clone https://github.com/jeffrog-256k1/har-share.git
cd har-share
npm ci
npm run build
npm run dev
# Open the local URL printed by Vite.
```

UTF-8 HAR 1.2 파일을 선택하거나 끌어놓으세요. 가상 예제로 먼저 확인할 수 있습니다. 제거 개수와 남은 워터폴을 검토하고 최소화 HAR 또는 독립 HTML 보고서를 저장합니다. 다운로드 이름은 고정입니다. 비우기는 현재 화면 결과를 지우며 자동 저장하지 않습니다. 화면과 문서는 5개 언어를 지원합니다.

## 동작 방식

허용한 HTTP 메서드·상태·MIME·응답 크기·시간 단계·요청 순서로 새 객체를 구성합니다. 호스트와 경로는 example.invalid 별칭으로 바꾸며 같은 리소스는 같은 별칭을 유지합니다. 쿼리 이름/값과 프래그먼트는 모두 제거합니다. 날짜는 2000-01-01에 원래 상대 간격을 더한 가상 값입니다. 페이지 제목·IP·연결 ID·리다이렉트 대상·헤더·쿠키·본문·확장 필드·원래 파일명은 남기지 않습니다.

표준 메서드 GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, CONNECT, TRACE 외에는 OTHER로 바꿉니다. MIME 허용 목록은 src/core.ts에 있으며 알 수 없는 값은 application/octet-stream으로, 파라미터는 제거합니다. HTTP 버전은 가상 HTTP/1.1, 상태 설명은 빈 문자열, 헤더 크기와 요청 본문 크기는 -1로 만듭니다. 전체 시간은 보존한 단계의 합으로 다시 계산하며 connect에 포함된 SSL을 중복 합산하지 않습니다. 입력/출력 필드 수의 차이를 제거한 비밀 개수로 해석하지 마세요.

## 지원 범위와 한계

10 MiB, HAR 1.2, HTTP(S) 1~2,000개, 시작 시각 범위 7일 이하, 단계별 시간과 전체 시간 24시간 이하, 크기 필드 1 TB 이하입니다. 숫자는 유한해야 하고 크기·상태는 정수여야 합니다. send/wait/receive는 0 이상, 선택 단계는 -1도 허용합니다. 필수 타이밍/크기 누락, data: 주소, WebSocket, 미지원 인코딩·형식은 오류로 처리합니다. 처리 시간 제한은 10초이며 ZIP은 받지 않습니다.

순서·응답 크기·상태·시간·리소스 관계는 여전히 정보입니다. 공유 전 검토해야 하며 완전한 익명성을 보장하지 않습니다. 본문이 없으므로 원래 요청을 재현하거나 본문 문제를 분석할 수 없습니다. HAR 1.2 스키마 및 Playwright HAR 가져오기를 검증했으며 모든 외부 뷰어 호환을 보장하지 않습니다. HTML에는 전체 항목, 화면에는 페이지당 50개를 표시합니다.

## 개발

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run format:check
```

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Dependencies](THIRD_PARTY_NOTICES.md)

Built by [jeffrog-256k1](https://github.com/jeffrog-256k1) · [leejungjae.app](https://leejungjae.app)
