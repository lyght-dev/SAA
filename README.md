# SAA

## 문항 메타데이터 추가

정답, 콘텐츠 도메인, 세부 task 및 관련 AWS 서비스는 CLI로 추가합니다. CLI는
`enums/question-metadata.json`에 정의된 값만 허용하며, task가 선택한 콘텐츠
도메인에 속하는지도 검증합니다. 복수 정답은 `--answer`를, 관련 서비스가 여러
개라면 `--aws-service`를 반복합니다.

```bash
node scripts/update-question-metadata.js questions/Q0001.json \
  --answer A \
  --content-domain "고성능 아키텍처 설계" \
  --content-task "고성능 데이터 수집 및 변환 솔루션 결정" \
  --aws-service "Amazon S3"
```

Markdown 원본이 바뀌었을 때만 ENUM 파일을 다시 생성합니다.

```bash
node scripts/generate-question-metadata-enums.js
```
