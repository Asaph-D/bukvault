/** DTOs alignés sur les réponses JSON Spring (microservices). */

export interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface BookSubscriptionItemDto {
  bookId: string;
  subscribedAt: string;
}

/** GET/PUT `/api/v1/notifications/preferences` */
export interface NotificationPreferencesDto {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  marketingEnabled: boolean;
}

export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'AUTHOR' | 'ADMIN';
  active: boolean;
  createdAt: string;
}

/** GET /users/{id} — profil complet user-service (aligné sur UserResponse Java). */
export interface UserProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  active: boolean;
  bio: string | null;
  avatarUrl: string | null;
  preferredLanguage: string | null;
  newsletter: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserProfileRequest {
  firstName: string;
  lastName: string;
  bio: string | null;
  avatarUrl: string | null;
  preferredLanguage: string | null;
  newsletter: boolean;
}

export type UserRoleDto = 'USER' | 'AUTHOR' | 'ADMIN';

export interface UpdateUserRoleRequest {
  role: UserRoleDto;
}

export interface UpdateUserActiveRequest {
  active: boolean;
}

/** GET/PUT /users/{id}/reader-settings */
export type ThemePreferenceDto = 'LIGHT' | 'DARK' | 'SYSTEM';
export type UiDensityDto = 'COMFORTABLE' | 'COMPACT';
export type CommunityVisibilityDto = 'PUBLIC' | 'MEMBERS_ONLY' | 'PRIVATE';
export type ReaderHomeDefaultDto = 'OVERVIEW' | 'CONTINUE' | 'DISCOVER';

export interface ReaderSettingsDto {
  theme: ThemePreferenceDto;
  uiDensity: UiDensityDto;
  localeOverride: string | null;
  notifyOrders: boolean;
  notifyPromotions: boolean;
  notifySocial: boolean;
  communityVisibility: CommunityVisibilityDto;
  allowDirectMessages: boolean;
  readerHomeDefault: ReaderHomeDefaultDto;
  libraryShowProgress: boolean;
  reduceMotion: boolean;
  updatedAt: string | null;
}

export interface UpdateReaderSettingsRequest {
  theme: ThemePreferenceDto;
  uiDensity: UiDensityDto;
  localeOverride: string | null;
  notifyOrders: boolean;
  notifyPromotions: boolean;
  notifySocial: boolean;
  communityVisibility: CommunityVisibilityDto;
  allowDirectMessages: boolean;
  readerHomeDefault: ReaderHomeDefaultDto;
  libraryShowProgress: boolean;
  reduceMotion: boolean;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

/** POST /auth/change-password */
export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}

/** POST /auth/logout-all */
export interface RevokeAllSessionsResponseDto {
  revokedRefreshTokens: number;
}

export interface BookListItemDto {
  id: string;
  title: string;
  isbn: string;
  authorId: string;
  price: number;
  language: string;
  format: 'EBOOK' | 'PHYSICAL' | 'BOTH';
  status: string;
  coverUrl: string | null;
  averageRating: number;
  reviewCount: number;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
}

export interface CategorySummaryDto {
  id: string;
  name: string;
  slug: string;
}

export interface BookDetailDto {
  id: string;
  title: string;
  isbn: string;
  description: string;
  price: number;
  language: string;
  format: 'EBOOK' | 'PHYSICAL' | 'BOTH';
  status: string;
  authorId: string;
  coverUrl: string | null;
  averageRating: number;
  reviewCount: number;
  viewCount: number;
  deleted: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categories: CategorySummaryDto[];
}

export interface CategoryResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  displayOrder: number;
  iconUrl: string | null;
  bookCount: number;
}

export interface AuthorPublicProfileDto {
  authorId: string;
  penName: string;
  website: string | null;
  bio: string | null;
  publishedBooksEstimate: number;
}

/** Requête `POST /api/v1/books` */
export interface CreateBookRequestDto {
  isbn: string;
  title: string;
  description: string;
  price: number;
  language: string;
  format: 'EBOOK' | 'PHYSICAL' | 'BOTH';
  categoryIds: string[];
  coverUrl: string | null;
  /** Renseigné uniquement par un ADMIN. */
  authorUserId: string | null;
}

/** Requête `PUT /api/v1/books/{id}` */
export interface UpdateBookRequestDto {
  isbn: string;
  title: string;
  description: string;
  price: number;
  language: string;
  format: 'EBOOK' | 'PHYSICAL' | 'BOTH';
  categoryIds: string[];
  coverUrl: string | null;
}

/** Requête `PATCH /api/v1/books/{id}/publish` */
export interface PublishBookRequestDto {
  publish: boolean;
}

/** Réponse `POST /api/v1/files/upload/*` */
export interface FileUploadResponseDto {
  id: number;
  bookId: string | null;
  mimeType: string;
  sizeBytes: number;
}

export interface CartLineDto {
  id: number;
  bookId: string;
  quantity: number;
  unitPrice: number;
  format: string;
  lineTotal: number;
}

/** Réponse `GET /api/v1/reading/progress` */
export interface ReadingProgressDto {
  bookId: string;
  mediaType: 'EBOOK' | 'AUDIOBOOK' | string;
  positionJson: string;
  deviceId: string | null;
  serverUpdatedAt: string;
  clientUpdatedAt: string | null;
}

/** wishlist-service */
export interface WishlistItemDto {
  id: number;
  bookId: string;
  addedAt: string;
}

export interface MoveToCartResponseDto {
  addedToCart: string[];
  errors: string[];
}

/** order-service */
export interface OrderLineDto {
  id: number;
  bookId: string;
  quantity: number;
  unitPrice: number;
  format: string;
  lineTotal: number;
}

export interface OrderResponseDto {
  id: number;
  userId: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | string;
  totalAmount: number;
  currency: string;
  paymentReference: string | null;
  createdAt: string;
  updatedAt: string;
  lines: OrderLineDto[];
}

/** community-service */
export interface CommunityHubDto {
  activeReaders: number;
  openSalons: number;
  tagline: string;
}

export interface CommunityThreadDto {
  id: string;
  title: string;
  channel: string;
  users: number;
  hot: boolean;
  last: string;
}

export interface CommunityEventDto {
  id: string;
  title: string;
  when: string;
  tag: string;
  startsAt: string;
}

export interface CommunityBuddyDto {
  id: string;
  name: string;
  reading: string;
  match: number;
}

export interface CommunityMemberDto {
  id: string;
  email: string;
  displayName: string;
  role: string;
  bio: string | null;
}

export interface MessagingConversationDto {
  id: string;
  peerUserId: string;
  lastMessagePreview: string | null;
  updatedAt: string;
}

export interface ChatMessageDto {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

/** GET /admin/dashboard — vue d'ensemble admin (admin-service). */
export interface AdminDashboardKpiDto {
  label: string;
  value: number;
  delta: string;
  up: boolean;
  severity: 'success' | 'info' | 'warn' | 'danger' | string;
}

export interface AdminCategoryShareDto {
  name: string;
  pct: number;
  color: string;
}

export interface AdminTopAuthorDto {
  name: string;
  reads: string;
  load: number;
}

export interface AdminDashboardDto {
  kpis: AdminDashboardKpiDto[];
  readsByDay: number[];
  readsByDayLabels: string[];
  totalReads: number;
  categoryShares: AdminCategoryShareDto[];
  topAuthors: AdminTopAuthorDto[];
  activityByWeekday: number[];
  activityWeekdayLabels: string[];
  pendingModeration: number;
  openReports: number;
  note: string | null;
}
