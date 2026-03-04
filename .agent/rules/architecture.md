---
trigger: always_on
---

# Clean Architecture

## Tổng quan

Dự án áp dụng **Clean Architecture** với tổ chức **Feature-first** (nhóm theo tính năng).

### Tại sao chọn Clean Architecture?

1. **Tách biệt concerns**: Business logic không phụ thuộc vào UI hay database
2. **Dễ test**: Mock repository để test use case độc lập
3. **Dễ thay đổi**: Đổi API sang GraphQL? Chỉ cần thay Repository Implementation
4. **Dễ maintain**: Mỗi layer có trách nhiệm rõ ràng, dễ tìm code

### Tại sao Feature-first?

1. **Gom code liên quan**: Tất cả code của 1 feature nằm gần nhau
2. **Dễ làm việc**: Khi develop feature "courses", chỉ cần focus vào folder courses
3. **Dễ scale**: Sau này có thể tách thành microservice theo feature

### Nguyên tắc quan trọng

> **Inner layers (domain) KHÔNG được phụ thuộc vào outer layers (infrastructure)**

```
Domain (interface) ← Application (use case) ← Infrastructure (implementation)
```

## Cấu trúc thư mục

```
src/
├── core/                               # Business Logic thuần (không có dependencies bên ngoài)
│   └── {feature-name}/
│       ├── domain/
│       │   ├── entities/               # Domain entities (optional)
│       │   └── repositories/           # Repository interfaces (contracts)
│       │       └── {entity}.repository.ts
│       ├── application/
│       │   └── use-cases/              # Application use cases
│       │       └── {action}.use-case.ts
│       └── factories/                  # Dependency Injection
│           └── {entity}.factory.ts
│
├── containers/                         # UI & Infrastructure (có dependencies bên ngoài)
│   └── {feature-name}/
│       ├── infrastructure/
│       │   └── repositories/           # Repository implementations
│       │       └── {entity}.repository.impl.ts
│       ├── components/                 # React components
│       ├── hooks/                      # React hooks (TanStack Query)
│       └── ...
│
├── shared/
│   └── types/                          # Shared TypeScript types
│
└── libs/
    └── api/
        └── fetch-client.ts             # HTTP client
```

**Lưu ý:** KHÔNG tạo folder `data-sources/`. Repository implementation gọi trực tiếp `fetchClient`.

## Chi tiết từng Layer

### 1. Domain Layer (`core/{feature}/domain`)

**Trách nhiệm:** Định nghĩa "hợp đồng" (contract) cho data operations.

**Tại sao cần interface?**

- Use case chỉ biết interface, không biết implementation cụ thể
- Dễ mock khi test
- Dễ swap implementation (API → localStorage, mock data)

```typescript
// src/core/courses/domain/repositories/course.repository.ts

/**
 * Course Repository Interface
 * Định nghĩa các operations cần thiết cho Course
 * KHÔNG chứa logic implementation
 */
export interface ICourseRepository {
  getCourses(params?: CourseFilterParams): Promise<PaginatedResponse<Course>>;
  getCourseBySlug(slug: string): Promise<Course>;
}
```

---

### 2. Application Layer (`core/{feature}/application`)

**Trách nhiệm:** Chứa business logic, orchestrate các operations.

**Tại sao cần Use Case?**

- Single Responsibility: Mỗi use case làm 1 việc
- Dễ test: Inject mock repository
- Reusable: Nhiều component có thể dùng chung use case

```typescript
// src/core/courses/application/use-cases/get-courses.use-case.ts

/**
 * Get Courses Use Case
 * Trách nhiệm: Lấy danh sách courses với filter/pagination
 *
 * Use case này chỉ biết repository interface (ICourseRepository)
 * Không biết và không quan tâm data từ đâu (API, localStorage, mock)
 */
export class GetCoursesUseCase {
  constructor(private readonly courseRepository: ICourseRepository) {}

  execute(params?: CourseFilterParams): Promise<PaginatedResponse<Course>> {
    // Có thể thêm business logic ở đây nếu cần
    // Ví dụ: validate params, transform data, apply business rules
    return this.courseRepository.getCourses(params);
  }
}
```

---

### 3. Infrastructure Layer (`containers/{feature}/infrastructure`)

**Trách nhiệm:** Implementation cụ thể của repository, giao tiếp với external services (API).

**Tại sao đặt ở containers?**

- Infrastructure có dependencies bên ngoài (fetchClient, axios)
- Tách biệt khỏi core để giữ core "pure"

```typescript
// src/containers/courses/infrastructure/repositories/course.repository.impl.ts

/**
 * Course Repository Implementation
 * Trách nhiệm: Gọi API và transform response về domain format
 *
 * Gọi fetchClient TRỰC TIẾP - không qua layer trung gian
 */
export class CourseRepositoryImpl implements ICourseRepository {
  async getCourses(params?: CourseFilterParams): Promise<PaginatedResponse<Course>> {
    // Gọi API
    const response = await fetchClient.get<ApiResponse<PaginatedResponse<Course>>>('/courses', { params });

    // Transform nếu cần (API format → Domain format)
    return response.data;
  }

  async getCourseBySlug(slug: string): Promise<Course> {
    const response = await fetchClient.get<ApiResponse<Course>>(`/courses/${slug}`);
    return response.data;
  }
}
```

---

### 4. Factory Layer (`core/{feature}/factories`)

**Trách nhiệm:** Dependency Injection - wire up các dependencies và export instances.

**Tại sao cần Factory?**

- Tập trung việc tạo instances ở 1 nơi
- Components chỉ cần import use case, không cần biết cách tạo
- Dễ thay đổi implementation (dev dùng mock, prod dùng API)

```typescript
// src/core/courses/factories/course.factory.ts

/**
 * Course Factory
 * Trách nhiệm: Tạo và wire up các instances
 *
 * Flow: Repository Impl → Use Case → Export
 */
import { CourseRepositoryImpl } from '@/containers/courses/infrastructure/repositories/course.repository.impl';

import { GetCoursesUseCase } from '../application/use-cases/get-courses.use-case';

// Tạo repository instance
const courseRepository = new CourseRepositoryImpl();

// Tạo và export use case instances (đã inject repository)
export const getCoursesUseCase = new GetCoursesUseCase(courseRepository);
```

---

### 5. Presentation Layer (`containers/{feature}/components, hooks`)

**Trách nhiệm:** UI logic, state management, user interactions.

**Tại sao hooks nằm ở containers?**

- Hooks sử dụng TanStack Query (external dependency)
- Hooks kết nối UI với use cases

```typescript
// src/containers/courses/hooks/use-courses.ts

/**
 * useCourses Hook
 * Trách nhiệm: Quản lý state và caching cho courses data
 *
 * Import use case từ factory, KHÔNG tạo trực tiếp
 */
import { getCoursesUseCase } from '@/core/courses/factories/course.factory';

export function useCourses(params?: CourseFilterParams) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => getCoursesUseCase.execute(params)
  });
}
```

## Data Flow (Luồng dữ liệu)

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION                              │
│  Component/Hook                                                  │
│      │                                                           │
│      │ import từ factory                                         │
│      ▼                                                           │
├─────────────────────────────────────────────────────────────────┤
│                        APPLICATION                               │
│  Use Case (từ factory)                                           │
│      │                                                           │
│      │ gọi method của repository (qua interface)                 │
│      ▼                                                           │
├─────────────────────────────────────────────────────────────────┤
│                          DOMAIN                                  │
│  Repository Interface                                            │
│      │                                                           │
│      │ được implement bởi                                        │
│      ▼                                                           │
├─────────────────────────────────────────────────────────────────┤
│                      INFRASTRUCTURE                              │
│  Repository Implementation                                       │
│      │                                                           │
│      │ gọi                                                       │
│      ▼                                                           │
│  fetchClient → REST API                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Best Practices

### NÊN làm

- Giữ mỗi layer tập trung vào 1 trách nhiệm
- Dùng interface cho repository contracts
- Inject dependencies qua constructor (trong use cases)
- Dùng factories để tạo instances và quản lý dependencies
- Repository Impl gọi `fetchClient` trực tiếp
- Handle data mapping/transformation trong Repository Impl

### KHÔNG NÊN làm

- Mix data access logic với UI logic
- Gọi `fetchClient` trực tiếp từ components hoặc use cases
- Bỏ qua interfaces cho repositories
- Đặt business logic trong infrastructure layer
- Tạo folder `data-sources/` - Repository nên gọi `fetchClient` trực tiếp
- Thêm abstraction layers không cần thiết giữa Repository và API

## Khi nào áp dụng Architecture này?

### Nên dùng khi:

- Feature có business logic phức tạp
- Cần nhiều data operations
- Cần testability cao (mock repositories)
- Feature có thể mở rộng trong tương lai

### Có thể bỏ qua khi:

- Static pages (không fetch data)
- Simple UI components
- One-off API calls trong Server Components (có thể dùng `fetchClient` trực tiếp)

## Ví dụ tạo feature mới

Khi tạo feature "enrollments":

```
src/
├── core/enrollments/
│   ├── domain/repositories/
│   │   └── enrollment.repository.ts      # Interface
│   ├── application/use-cases/
│   │   └── create-enrollment.use-case.ts # Use case
│   └── factories/
│       └── enrollment.factory.ts         # DI factory
│
└── containers/enrollments/
    ├── infrastructure/repositories/
    │   └── enrollment.repository.impl.ts # Implementation
    ├── components/
    │   └── enrollment-form.tsx           # UI
    └── hooks/
        └── use-enrollment.ts             # Hook + TanStack Query
```
