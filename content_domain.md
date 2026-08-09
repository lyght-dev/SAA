

# 콘텐츠 도메인 1: 보안 아키텍처 설계
<a name="solutions-architect-associate-03-domain1"></a>

**Topics**
+ [작업 1.1: AWS 리소스에 대한 보안 액세스 설계](#solutions-architect-associate-03-domain1-task1)
+ [작업 1.2: 안전한 워크로드 및 애플리케이션 설계](#solutions-architect-associate-03-domain1-task2)
+ [작업 1.3: 적합한 데이터 보안 제어 결정](#solutions-architect-associate-03-domain1-task3)

## 작업 1.1: AWS 리소스에 대한 보안 액세스 설계
<a name="solutions-architect-associate-03-domain1-task1"></a>

관련 지식:
+ 여러 계정에 대한 액세스 제어 및 관리
+ AWS 페더레이션된 액세스 및 ID 서비스(예: IAM, AWS IAM Identity Center)
+ AWS 글로벌 인프라(예: 가용 영역, AWS 리전)
+ AWS 보안 모범 사례(예: 최소 권한의 원칙)
+ AWS 공동 책임 모델

관련 기술:
+ IAM 사용자 및 루트 사용자에게 AWS 보안 모범 사례 적용(예: 다중 인증(MFA))
+ IAM 사용자, 그룹, 역할 및 정책을 포함하는 유연한 권한 부여 모델 설계
+ 역할 기반 액세스 제어 전략 설계(예: AWS STS, 역할 전환, 크로스 계정 액세스)
+ 여러 AWS 계정에 대한 보안 전략 설계(예: AWS Control Tower, 서비스 제어 정책(SCP))
+ AWS 서비스에 적합한 리소스 정책 사용 결정
+ 디렉터리 서비스를 IAM 역할과 연동할 시기 결정

## 작업 1.2: 안전한 워크로드 및 애플리케이션 설계
<a name="solutions-architect-associate-03-domain1-task2"></a>

관련 지식:
+ 애플리케이션 구성 및 보안 인증 정보의 보안
+ AWS 서비스 엔드포인트
+ AWS에서 포트, 프로토콜 및 네트워크 트래픽 제어
+ 안전한 애플리케이션 액세스
+ 적절한 사용 사례를 갖춘 보안 서비스(예: AWS Cognito, AWS GuardDuty, AWS Macie)
+ AWS 외부의 위협 벡터(예: DDoS, SQL 인젝션)

관련 기술:
+ 보안 구성 요소(예: 보안 그룹, 라우팅 테이블, 네트워크 ACL, NAT 게이트웨이)로 VPC 아키텍처 설계
+ 네트워크 분할 전략 결정(예: 퍼블릭 서브넷 및 프라이빗 서브넷 사용)
+ 보안 애플리케이션에 AWS 서비스 통합(예: AWS Shield, AWS WAF, IAM Identity Center, AWS Secrets Manager)
+ AWS 클라우드와의 외부 네트워크 연결 보호(예: VPN, AWS Direct Connect)

## 작업 1.3: 적합한 데이터 보안 제어 결정
<a name="solutions-architect-associate-03-domain1-task3"></a>

관련 지식:
+ 데이터 액세스 및 거버넌스
+ 데이터 복구
+ 데이터 보존 및 분류
+ 암호화 및 적합한 키 관리

관련 기술:
+ 규정 준수 요구 사항을 충족하도록 AWS 기술 조율
+ 저장된 데이터 암호화(예: AWS KMS)
+ 전송 중 데이터 암호화(예: TLS를 사용하는 AWS Certificate Manager(ACM))
+ 암호화 키에 대한 액세스 정책 구현
+ 데이터 백업 및 복제 구현
+ 데이터 액세스, 수명 주기 및 보호를 위한 정책 구현
+ 암호화 키 교체 및 인증서 갱신




# 콘텐츠 도메인 2: 복원력을 갖춘 아키텍처 설계
<a name="solutions-architect-associate-03-domain2"></a>

**Topics**
+ [작업 2.1: 확장 가능하고 느슨하게 결합된 아키텍처 설계](#solutions-architect-associate-03-domain2-task1)
+ [작업 2.2: 고가용성 및/또는 내결함성 아키텍처 설계](#solutions-architect-associate-03-domain2-task2)

## 작업 2.1: 확장 가능하고 느슨하게 결합된 아키텍처 설계
<a name="solutions-architect-associate-03-domain2-task1"></a>

관련 지식:
+ API 만들기 및 관리(예: Amazon API Gateway, REST API)
+ AWS Managed Services와 적합한 사용 사례(예: AWS Transfer Family, Amazon SQS, AWS Secrets Manager)
+ 캐싱 전략
+ 마이크로서비스의 설계 원칙(예: 스테이트리스 워크로드와 스테이트풀 워크로드 비교)
+ 이벤트 기반 아키텍처
+ 수평적 스케일링 및 수직적 스케일링
+ 엣지 액셀러레이터를 적절하게 사용하는 방법(예: 콘텐츠 전송 네트워크(CDN))
+ 애플리케이션을 컨테이너로 마이그레이션하는 방법
+ 로드 밸런싱 개념(예: Application Load Balancer(ALB))
+ 멀티 티어 아키텍처
+ 대기열 및 메시징 개념(예: 게시/구독)
+ 서버리스 기술 및 패턴(예: AWS Fargate, AWS Lambda)
+ 연관된 특성이 있는 스토리지 유형(예: 객체, 파일, 블록)
+ 컨테이너의 오케스트레이션(예: Amazon ECS, Amazon EKS)
+ 읽기 전용 복제본 사용 시기
+ 워크플로 오케스트레이션(예: AWS Step Functions)

관련 기술:
+ 요구 사항에 따라 이벤트 기반, 마이크로서비스 및/또는 멀티 티어 아키텍처 설계
+ 아키텍처 설계에 사용되는 구성 요소의 스케일링 전략 결정
+ 요구 사항에 따라 느슨한 결합을 달성하는 데 필요한 AWS 서비스 결정
+ 컨테이너 사용 시기 결정
+ 서버리스 기술 및 패턴 사용 시기 결정
+ 요구 사항에 따라 적합한 컴퓨팅, 스토리지, 네트워킹 및 데이터베이스 기술 권장
+ 워크로드에 맞춰 특별히 구축된 AWS 서비스 사용

## 작업 2.2: 고가용성 및/또는 내결함성 아키텍처 설계
<a name="solutions-architect-associate-03-domain2-task2"></a>

관련 지식:
+ AWS 글로벌 인프라(예: 가용 영역, AWS 리전, Amazon Route 53)
+ AWS Managed Services와 적합한 사용 사례(예: Amazon Comprehend, Amazon Polly)
+ 기본 네트워킹 개념(예: 라우팅 테이블)
+ 재해 복구(DR) 전략(예: 백업 및 복원, 파일럿 라이트, 예열 대기 방식, 활성/활성 장애 조치, RPO(복구 시점 목표), RTO(복구 시간 목표))
+ 분산 설계 패턴
+ 장애 조치 전략
+ 변경 불가능한 인프라
+ 로드 밸런싱 개념(예: ALB)
+ 프록시 개념(예: Amazon RDS Proxy)
+ Service Quotas 및 제한(예: 대기 환경에서 워크로드에 대한 Service Quotas를 구성하는 방법)
+ 스토리지 옵션 및 특성(예: 내구성, 복제)
+ 워크로드 가시성(예: AWS X-Ray)

관련 기술:
+ 인프라 무결성을 보장하기 위한 자동화 전략 결정
+ AWS 리전 또는 가용 영역 전체에서 고가용성 및/또는 내결함성 아키텍처를 제공하는 데 필요한 AWS 서비스 결정
+ 비즈니스 요구 사항에 따라 지표를 파악하여 고가용성 솔루션 제공
+ 단일 실패 지점을 완화하기 위한 설계 구현
+ 데이터의 내구성과 가용성을 보장하기 위한 전략 구현(예: 백업)
+ 비즈니스 요구 사항을 충족하는 적합한 DR 전략 선택
+ 레거시 애플리케이션과 클라우드용으로 구축되지 않은 애플리케이션의 신뢰성을 개선하는 AWS 서비스 사용(예: 애플리케이션 변경이 불가능한 경우)
+ 워크로드에 맞춰 특별히 구축된 AWS 서비스 사용



# 콘텐츠 도메인 3: 고성능 아키텍처 설계
<a name="solutions-architect-associate-03-domain3"></a>

**Topics**
+ [작업 3.1: 고성능 및/또는 확장 가능한 스토리지 솔루션 결정](#solutions-architect-associate-03-domain3-task1)
+ [작업 3.2: 고성능의 탄력적인 컴퓨팅 솔루션 설계](#solutions-architect-associate-03-domain3-task2)
+ [작업 3.3: 고성능 데이터베이스 솔루션 결정](#solutions-architect-associate-03-domain3-task3)
+ [작업 3.4: 고성능 및/또는 확장 가능한 네트워크 아키텍처 결정](#solutions-architect-associate-03-domain3-task4)
+ [작업 3.5: 고성능 데이터 수집 및 변환 솔루션 결정](#solutions-architect-associate-03-domain3-task5)

## 작업 3.1: 고성능 및/또는 확장 가능한 스토리지 솔루션 결정
<a name="solutions-architect-associate-03-domain3-task1"></a>

관련 지식:
+ 비즈니스 요구 사항을 충족하는 하이브리드 스토리지 솔루션
+ 스토리지 서비스와 적합한 사용 사례(예: Amazon S3, Amazon EFS, Amazon EBS)
+ 연관된 특성이 있는 스토리지 유형(예: 객체, 파일, 블록)

관련 기술:
+ 성능 요구 사항을 충족하는 스토리지 서비스 및 구성 결정
+ 향후 요구 사항을 수용하도록 규모 조정 가능한 스토리지 서비스 결정

## 작업 3.2: 고성능의 탄력적인 컴퓨팅 솔루션 설계
<a name="solutions-architect-associate-03-domain3-task2"></a>

관련 지식:
+ AWS 컴퓨팅 서비스와 적합한 사용 사례(예: AWS Batch, Amazon EMR, AWS Fargate)
+ AWS 글로벌 인프라 및 엣지 서비스에서 지원하는 분산 컴퓨팅 개념
+ 대기열 및 메시징 개념(예: 게시/구독)
+ 확장성 기능과 적합한 사용 사례(예: Amazon EC2 Auto Scaling, AWS Auto Scaling)
+ 서버리스 기술 및 패턴(예: AWS Lambda, Fargate)
+ 컨테이너의 오케스트레이션(예: Amazon ECS, Amazon EKS)

관련 기술:
+ 구성 요소 크기를 독립적으로 규모를 조정할 수 있도록 워크로드 분리
+ 스케일링 작업을 수행하기 위한 지표 및 조건 파악
+ 비즈니스 요구 사항을 충족하는 적합한 컴퓨팅 옵션 및 기능 선택(예: EC2 인스턴스 유형)
+ 비즈니스 요구 사항을 충족하는 적합한 리소스 유형 및 크기 선택(예: Lambda 메모리 양)

## 작업 3.3: 고성능 데이터베이스 솔루션 결정
<a name="solutions-architect-associate-03-domain3-task3"></a>

관련 지식:
+ AWS 글로벌 인프라(예: 가용 영역, AWS 리전)
+ 캐싱 전략 및 서비스(예: Amazon ElastiCache)
+ 데이터 액세스 패턴(예: 읽기 집약적 패턴과 쓰기 집약적 패턴 비교)
+ 데이터베이스 용량 계획(예: 용량 단위, 인스턴스 유형, 프로비저닝된 IOPS)
+ 데이터베이스 연결 및 프록시
+ 데이터베이스 엔진과 적합한 사용 사례(예: 이기종 마이그레이션, 동종 마이그레이션)
+ 데이터베이스 복제(예: 읽기 전용 복제본)
+ 데이터베이스 유형 및 서비스(예: 서버리스, 관계형과 비관계형 비교, 인 메모리)

관련 기술:
+ 비즈니스 요구 사항을 충족하도록 읽기 전용 복제본 구성
+ 데이터베이스 아키텍처 설계
+ 적합한 데이터베이스 엔진 결정(예: MySQL과 PostgreSQL 비교)
+ 적합한 데이터베이스 유형 결정(예: Amazon Aurora, Amazon DynamoDB)
+ 비즈니스 요구 사항을 충족하도록 캐싱 통합

## 작업 3.4: 고성능 및/또는 확장 가능한 네트워크 아키텍처 결정
<a name="solutions-architect-associate-03-domain3-task4"></a>

관련 지식:
+ 엣지 네트워킹 서비스와 적합한 사용 사례(예: Amazon CloudFront, AWS Global Accelerator)
+ 네트워크 아키텍처 설계 방법(예: 서브넷 티어, 라우팅, IP 주소 지정)
+ 로드 밸런싱 개념(예: Application Load Balancer)
+ 네트워크 연결 옵션(예: AWS VPN, AWS Direct Connect, AWS PrivateLink)

관련 기술:
+ 다양한 아키텍처에 대한 네트워크 토폴로지 만들기(예: 글로벌, 하이브리드, 멀티 티어)
+ 향후 요구 사항을 수용하도록 규모 조정 가능한 네트워크 구성 결정
+ 비즈니스 요구 사항을 충족하는 적합한 리소스 배치 결정
+ 적합한 로드 밸런싱 전략 선택

## 작업 3.5: 고성능 데이터 수집 및 변환 솔루션 결정
<a name="solutions-architect-associate-03-domain3-task5"></a>

관련 지식:
+ 데이터 분석 및 시각화 서비스와 적합한 사용 사례(예: Amazon Athena, AWS Lake Formation, Amazon QuickSuite)
+ 데이터 수집 패턴(예: 빈도)
+ 데이터 전송 서비스와 적합한 사용 사례(예: AWS DataSync, AWS Storage Gateway)
+ 데이터 변환 서비스와 적합한 사용 사례(예: AWS Glue)
+ 수집 액세스 포인트에 대한 보안 액세스
+ 비즈니스 요구 사항을 충족하는 데 필요한 크기 및 속도
+ 스트리밍 데이터 서비스와 적합한 사용 사례(예: Amazon Kinesis)

관련 기술:
+ 데이터 레이크 구축 및 보호
+ 데이터 스트리밍 아키텍처 설계
+ 데이터 전송 솔루션 설계
+ 시각화 전략 구현
+ 데이터 처리에 적합한 컴퓨팅 옵션 선택(예: Amazon EMR)
+ 수집에 적합한 구성 선택
+ 데이터 형식 변환(예: .csv에서.parquet으로 변환)



# 콘텐츠 도메인 4: 비용에 최적화된 아키텍처 설계
<a name="solutions-architect-associate-03-domain4"></a>

**Topics**
+ [작업 4.1: 비용에 최적화된 스토리지 솔루션 설계](#solutions-architect-associate-03-domain4-task1)
+ [작업 4.2: 비용에 최적화된 컴퓨팅 솔루션 설계](#solutions-architect-associate-03-domain4-task2)
+ [작업 4.3: 비용에 최적화된 데이터베이스 솔루션 설계](#solutions-architect-associate-03-domain4-task3)
+ [작업 4.4: 비용에 최적화된 네트워크 아키텍처 설계](#solutions-architect-associate-03-domain4-task4)

## 작업 4.1: 비용에 최적화된 스토리지 솔루션 설계
<a name="solutions-architect-associate-03-domain4-task1"></a>

관련 지식:
+ 액세스 옵션(예: 요청자 지불 객체 스토리지가 포함된 S3 버킷)
+ AWS 비용 관리 서비스 기능(예: 비용 할당 태그, 다중 계정 결제)
+ AWS 비용 관리 도구와 적합한 사용 사례(예: AWS Cost Explorer, AWS Budgets, AWS Cost and Usage Report)
+ AWS 스토리지 서비스와 적합한 사용 사례(예: Amazon FSx, Amazon EFS, Amazon S3, Amazon EBS)
+ 백업 전략
+ 블록 스토리지 옵션(예: 하드 디스크 드라이브(HDD) 볼륨 유형, 솔리드 스테이트 드라이브(SSD) 볼륨 유형)
+ 데이터 수명 주기
+ 하이브리드 스토리지 옵션(예: AWS DataSync, AWS Transfer Family, AWS Storage Gateway)
+ 스토리지 액세스 패턴
+ 스토리지 계층화(예: 객체 스토리지의 콜드 계층화)
+ 연관된 특성이 있는 스토리지 유형(예: 객체, 파일, 블록)

관련 기술:
+ 적합한 스토리지 전략 설계(예: Amazon S3에 배치 업로드와 개별 업로드 비교)
+ 워크로드에 올바른 스토리지 크기 결정
+ 워크로드에 대한 데이터를 AWS 스토리지로 전송하는 가장 저렴한 방법 결정
+ 스토리지 오토 스케일링이 필요한 시점 결정
+ S3 객체 수명 주기 관리
+ 적합한 백업 및/또는 아카이브 솔루션 선택
+ 스토리지 서비스로의 데이터 마이그레이션에 적합한 서비스 선택
+ 적합한 스토리지 티어 선택
+ 스토리지에 올바른 데이터 수명 주기 선택
+ 워크로드에 가장 비용 효율적인 스토리지 서비스 선택

## 작업 4.2: 비용에 최적화된 컴퓨팅 솔루션 설계
<a name="solutions-architect-associate-03-domain4-task2"></a>

관련 지식:
+ AWS 비용 관리 서비스 기능(예: 비용 할당 태그, 다중 계정 결제)
+ AWS 비용 관리 도구와 적합한 사용 사례(예: AWS Cost Explorer, AWS Budgets, AWS Cost and Usage Report)
+ AWS 글로벌 인프라(예: 가용 영역, AWS 리전)
+ AWS 구매 옵션(예: 스팟 인스턴스, 예약 인스턴스, 절감형 플랜)
+ 분산 컴퓨팅 전략(예: 엣지 프로세싱)
+ 하이브리드 컴퓨팅 옵션(예: AWS Outposts)
+ 인스턴스 유형, 패밀리 및 크기(예: 메모리 최적화, 컴퓨팅 최적화, 가상화)
+ 컴퓨팅 사용률 최적화(예: 컨테이너, 서버리스 컴퓨팅, 마이크로서비스)
+ 크기 조정 전략(예: 오토 스케일링, 최대 절전 모드)

관련 기술:
+ 적합한 로드 밸런싱 전략 결정(예: Application Load Balancer(계층 7)와 Network Load Balancer(계층 4)와 Gateway Load Balancer 비교)
+ 탄력적인 워크로드에 적합한 스케일링 방법 및 전략 결정(예: 수평과 수직 비교, EC2 최대 절전 모드)
+ 적합한 사용 사례로 비용 효율적인 AWS 컴퓨팅 서비스 결정(예: AWS Lambda, Amazon EC2, AWS Fargate)
+ 다양한 워크로드 클래스에 필요한 가용성 결정(예: 프로덕션 워크로드, 비프로덕션 워크로드)
+ 워크로드에 적합한 인스턴스 패밀리 선택
+ 워크로드에 적합한 인스턴스 크기 선택

## 작업 4.3: 비용에 최적화된 데이터베이스 솔루션 설계
<a name="solutions-architect-associate-03-domain4-task3"></a>

관련 지식:
+ AWS 비용 관리 서비스 기능(예: 비용 할당 태그, 다중 계정 결제)
+ AWS 비용 관리 도구와 적합한 사용 사례(예: AWS Cost Explorer, AWS Budgets, AWS Cost and Usage Report)
+ 캐싱 전략
+ 데이터 보존 정책
+ 데이터베이스 용량 계획(예: 용량 단위)
+ 데이터베이스 연결 및 프록시
+ 데이터베이스 엔진과 적합한 사용 사례(예: 이기종 마이그레이션, 동종 마이그레이션)
+ 데이터베이스 복제(예: 읽기 전용 복제본)
+ 데이터베이스 유형 및 서비스(예: 관계형과 비관계형 비교, Amazon Aurora, Amazon DynamoDB)

관련 기술:
+ 적합한 백업 및 보존 정책 설계(예: 스냅샷 빈도)
+ 적합한 데이터베이스 엔진 결정(예: MySQL과 PostgreSQL 비교)
+ 적합한 사용 사례로 비용 효율적인 AWS 데이터베이스 서비스 결정(예: DynamoDB와 Amazon RDS 비교, 서버리스)
+ 비용 효율적인 AWS 데이터베이스 유형 결정(예: 시계열 형식, 열 형식)
+ 데이터베이스 스키마와 데이터를 다른 위치 및/또는 다른 데이터베이스 엔진으로 마이그레이션

## 작업 4.4: 비용에 최적화된 네트워크 아키텍처 설계
<a name="solutions-architect-associate-03-domain4-task4"></a>

관련 지식:
+ AWS 비용 관리 서비스 기능(예: 비용 할당 태그, 다중 계정 결제)
+ AWS 비용 관리 도구와 적합한 사용 사례(예: AWS Cost Explorer, AWS Budgets, AWS Cost and Usage Report)
+ 로드 밸런싱 개념(예: Application Load Balancer)
+ NAT 게이트웨이(예: NAT 인스턴스 비용과 NAT 게이트웨이 비용 비교)
+ 네트워크 연결(예: 프라이빗 회선, 전용 회선, VPN)
+ 네트워크 라우팅, 토폴로지 및 피어링(예: AWS Transit Gateway, VPC 피어링)
+ 네트워크 서비스와 적합한 사용 사례(예: DNS)

관련 기술:
+ 네트워크에 적합한 NAT 게이트웨이 유형 구성(예: 단일 공유 NAT 게이트웨이와 각 가용 영역의 NAT 게이트웨이 비교)
+ 적합한 네트워크 연결 구성(예: AWS Direct Connect와 VPN과 인터넷 비교)
+ 네트워크 전송 비용을 최소화하는 데 적합한 네트워크 경로 구성(예: 리전 간, 가용 영역 간, 프라이빗과 퍼블릭 간, AWS Global Accelerator, VPC 엔드포인트)
+ 콘텐츠 전송 네트워크(CDN) 및 엣지 캐싱에 대한 전략적 요구 사항 결정
+ 네트워크 최적화를 위한 기존 워크로드 검토
+ 적합한 제한 전략 선택
+ 네트워크 디바이스에 적합한 대역폭 할당 선택(예: 단일 VPN과 복수 VPN 비교, Direct Connect 속도)