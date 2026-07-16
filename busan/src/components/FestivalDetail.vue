<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import FestivalDetailMap from './FestivalDetailMap.vue'
import festivalsData from '../assets/festivals.json'

const props = defineProps({
  festivalId: {
    type: [String, Number],
    default: ''
  },
  contentid: {
    type: [String, Number],
    default: ''
  }
})

const selectedFestival = ref(null)
const reviews = ref([])
const editingId = ref(null)
const errorText = ref('')
const likesMeta = ref({})
// 💡 내가 어떤 축제들에 좋아요를 눌렀는지 ID를 저장할 배열 변수
const myLikes = ref([])

const reviewForm = ref({
  nickname: '',
  content: '',
  rating: 5,
  password: ''
})

// 시연용 고정 리뷰 사용 여부입니다.
// 배포할 때 false로 바꾸면 미리 등록한 리뷰는 자동으로 제거되고, 사용자 리뷰만 유지됩니다.
const ENABLE_DEMO_REVIEWS = true

function getSeedReviewsForFestival(festival) {
  const title = festival?.title ?? ''
  const lowerTitle = title.toLowerCase()

  if (/(불교)/.test(lowerTitle)) {
    return [
      {
        nickname: '명상여행자',
        rating: 5,
        content: '전시와 체험이 잘 연결돼 있어서 마음을 편하게 정리할 수 있었어요. 부산에서 여유롭게 보내기 좋았습니다.'
      }
    ]
  }

  if (/(전통시장)/.test(lowerTitle)) {
    return [
      {
        nickname: '시장탐방러',
        rating: 5,
        content: '다양한 먹거리와 체험이 있어서 가족과 함께 즐기기 좋았어요. 부산의 전통을 느낄 수 있는 좋은 기회였습니다.'
      },
      {
        nickname: '부산동행',
        rating: 4,
        content: '친구랑 맛있는 음식도 먹고, 다양한 체험도 즐길 수 있어서 하루 종일 즐겁게 보냈습니다.'
      }
    ]
  }

  if (/(나이트|레이스|광안)/.test(lowerTitle)) {
    return [
      {
        nickname: '야경좋아',
        rating: 5,
        content: '야간 분위기가 정말 화려하고, 바다 위로 펼쳐진 조명이 인상적이었어요.'
      },
      {
        nickname: '광안리방문',
        rating: 4,
        content: '저녁에 가서 바다와 함께 즐기기 좋았고, 주변 식당도 많아서 편리했습니다.'
      }
    ]
  }

  if (/(영화|시네마)/.test(lowerTitle)) {
    return [
      {
        nickname: '영화덕후',
        rating: 5,
        content: '현장감이 살아 있어서 공연이나 전시를 직접 보는 느낌이 정말 좋았어요.'
      },
      {
        nickname: '부산감성',
        rating: 4,
        content: '축제의 분위기가 살아 있고, 오랜만에 부산의 에너지를 느낄 수 있어서 만족스러웠습니다.'
      }
    ]
  }

  if (/(록|뮤직)/.test(lowerTitle)) {
    return [
      {
        nickname: '록팬',
        rating: 5,
        content: '현장 분위기가 정말 뜨겁고, 무대와 관객의 에너지가 좋아서 재방문하고 싶어요.'
      },
      {
        nickname: '뮤직트래블',
        rating: 4,
        content: '부대 프로그램도 다양해서 하루 종일 즐기기 좋았습니다.'
      }
    ]
  }

  if (/(어린이|책|키즈|체험)/.test(lowerTitle)) {
    return [
      {
        nickname: '가족여행',
        rating: 5,
        content: '아이들과 함께 가기 정말 좋았고, 체험 부스도 다양해서 즐거운 시간이었어요.'
      },
      {
        nickname: '책읽는가족',
        rating: 4,
        content: '어린이와 부모 모두 즐길 수 있는 구성이라 부담 없이 방문하기 좋았습니다.'
      }
    ]
  }

  if (/(빛|트리|조명|야경)/.test(lowerTitle)) {
    return [
      {
        nickname: '빛축제러버',
        rating: 5,
        content: '밤에 가면 조명이 정말 아름다워서 산책하면서 보기 좋은 축제였어요.'
      },
      {
        nickname: '사진여행자',
        rating: 4,
        content: '포토존과 조명이 예뻐서 여행 사진 남기기 딱 좋았습니다.'
      }
    ]
  }

    return [
    {
      nickname: '부산여행자',
      rating: 5,
      content: '축제 분위기가 살아 있고, 부산의 감성을 충분히 느낄 수 있어서 만족스러웠어요.'
    },
    {
      nickname: '한줄후기',
      rating: 4,
      content: '여유롭게 둘러보기 좋고, 주변 관광지와 함께 가기에도 편해서 추천하고 싶어요.'
    }
  ]

}

function seedDefaultReviewsForSelectedFestival() {
  if (typeof window === 'undefined' || !selectedFestival.value) return

  const key = storageKey.value
  const demoSource = getSeedReviewsForFestival(selectedFestival.value)

  try {
    const raw = window.localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    const existingReviews = Array.isArray(parsed) ? parsed : []

    // 이전 코드로 저장된 고정 리뷰도 시연용으로 판별합니다.
    const isStoredDemoReview = (review) => {
      const matchesDemoText = demoSource.some(
        (demo) =>
          demo.nickname === review.nickname &&
          demo.content === review.content
      )

      return (
        review.isDemo === true ||
        review.password === 'seed' ||
        String(review.id ?? '').startsWith('demo-') ||
        matchesDemoText
      )
    }

    // 사용자가 직접 등록한 리뷰만 별도로 보존합니다.
    const userReviews = existingReviews
      .filter((review) => !isStoredDemoReview(review))
      .map((review) => ({
        ...review,
        isDemo: false
      }))

    // 배포 모드에서는 시연용 리뷰를 완전히 제거합니다.
    if (!ENABLE_DEMO_REVIEWS) {
      reviews.value = userReviews
      window.localStorage.setItem(key, JSON.stringify(userReviews))
      return
    }

    // 모든 미리 등록한 리뷰를 동일한 시연용 구조로 다시 생성합니다.
    const demoReviews = demoSource.map((review, index) => ({
      id: `demo-${resolvedFestivalId.value}-${index}`,
      nickname: review.nickname,
      content: review.content,
      rating: Number(review.rating),
      password: 'seed',
      isDemo: true
    }))

    const mergedReviews = [...demoReviews, ...userReviews]

    reviews.value = mergedReviews
    window.localStorage.setItem(key, JSON.stringify(mergedReviews))
  } catch {
    reviews.value = []
  }
}

const resolvedFestivalId = computed(() => {
  const rawValue = props.festivalId ?? props.contentid ?? ''
  return String(rawValue).trim() || '506545'
})

const feeInfo = computed(() => {
  const rawValue = selectedFestival.value?.usetimefestival
  const text = String(rawValue ?? '').trim().replace(/<br>/g, ' ')
  const normalized = text.replace(/\s+/g, ' ').trim()

  if (!normalized || normalized === 'null') {
    return {
      label: '정보 없음',
      description: '요금 정보가 등록되지 않았어요.'
    }
  }

  const lowerText = normalized.toLowerCase()

  if (lowerText.includes('유료') && lowerText.includes('무료')) {
    return {
      label: '부분 유료',
      description: normalized
    }
  }

  if (lowerText.includes('유료') || /원/.test(lowerText) || /가격/.test(lowerText)) {
    return {
      label: '유료',
      description: normalized
    }
  }

  if (lowerText.includes('무료')) {
    return {
      label: '무료',
      description: normalized
    }
  }

  return {
    label: '상세 확인',
    description: normalized
  }
})

const storageKey = computed(() => `festival-reviews-${resolvedFestivalId.value}`)
const likesStorageKey = 'busan-festival-likes-meta-v2'
const myLikesStorageKey = 'busan-festival-user-liked' // 💡 유저 개인의 좋아요 기록 키

// 💡 현재 보고 있는 축제에 내가 좋아요를 눌렀는지 확인하는 컴퓨터 변수
const isCurrentFestivalLiked = computed(() => {
  if (!selectedFestival.value) return false
  return myLikes.value.includes(String(selectedFestival.value.contentid))
})

function getFestivalById() {
  const items = festivalsData?.items ?? []
  const targetId = resolvedFestivalId.value

  const matched = items.find((item) => String(item.contentid) === String(targetId))
  const fallback = items.find((item) => String(item.contentid) === '506545')

  selectedFestival.value = matched || fallback || items[0] || null
}

function loadLikesMeta() {
  if (typeof window === 'undefined') return

  try {
    const raw = window.localStorage.getItem(likesStorageKey)

    if (raw) {
      likesMeta.value = JSON.parse(raw)
    } else {
      // 💡 요구사항 반영: 가짜 데이터 제거하고 처음엔 무조건 하트가 0개로 시작하도록 초기화
      const fallback = {}
      const items = festivalsData?.items ?? []
      items.forEach((item) => {
        fallback[String(item.contentid)] = 0
      })

      likesMeta.value = fallback
      window.localStorage.setItem(likesStorageKey, JSON.stringify(fallback))
    }
  } catch {
    likesMeta.value = {}
  }
}

// 💡 내가 과거에 눌렀던 좋아요 목록 불러오기
function loadMyLikes() {
  if (typeof window === 'undefined') return
  try {
    const saved = window.localStorage.getItem(myLikesStorageKey)
    myLikes.value = saved ? JSON.parse(saved) : []
  } catch {
    myLikes.value = []
  }
}

function saveLikesMeta() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(likesStorageKey, JSON.stringify(likesMeta.value))
  // 다른 컴포넌트(구별 지도 목록 등)에 실시간으로 좋아요가 바뀌었다고 이벤트를 쏴줍니다.
  window.dispatchEvent(new Event('festival-reviews-updated'))
}

// 💡 내가 누른 좋아요 기록 저장하기
function saveMyLikes() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(myLikesStorageKey, JSON.stringify(myLikes.value))
}

function getLikeCount(contentid) {
  const value = likesMeta.value?.[String(contentid)]
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

// 💡 1인 1하트 제한 토글 함수로 전면 수정
function toggleLike() {
  if (!selectedFestival.value) return

  const id = String(selectedFestival.value.contentid)
  const currentCount = getLikeCount(id)

  if (isCurrentFestivalLiked.value) {
    // 이미 하트를 누른 축제라면 ➡️ 취소 요청 (-1)
    likesMeta.value = {
      ...likesMeta.value,
      [id]: Math.max(0, currentCount - 1)
    }
    // 내 하트 기록 배열에서 삭제
    myLikes.value = myLikes.value.filter((item) => item !== id)
  } else {
    // 처음 누르는 축제라면 ➡️ 하트 추가 (+1)
    likesMeta.value = {
      ...likesMeta.value,
      [id]: currentCount + 1
    }
    // 내 하트 기록 배열에 추가
    myLikes.value.push(id)
  }

  saveLikesMeta()
  saveMyLikes()
}

function loadReviews() {
  if (typeof window === 'undefined') return

  try {
    const saved = window.localStorage.getItem(storageKey.value)
    reviews.value = saved ? JSON.parse(saved) : []
  } catch {
    reviews.value = []
  }
}

function saveReviews() {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    storageKey.value,
    JSON.stringify(reviews.value)
  )

  window.dispatchEvent(new Event('festival-reviews-updated'))
}

function resetForm() {
  reviewForm.value = {
    nickname: '',
    content: '',
    rating: 5,
    password: ''
  }
  editingId.value = null
  errorText.value = ''
}

function submitReview() {
  const nickname = reviewForm.value.nickname.trim()
  const content = reviewForm.value.content.trim()
  const password = reviewForm.value.password.trim()

  if (!nickname || !content || !password) {
    errorText.value = '닉네임, 리뷰 내용, 비밀번호를 모두 입력해주세요.'
    return
  }

  if (editingId.value) {
    const target = reviews.value.find((item) => item.id === editingId.value)

    if (!target) {
      errorText.value = '수정할 리뷰를 찾지 못했습니다.'
      return
    }

    if (target.password !== password) {
      errorText.value = '비밀번호가 일치하지 않아 수정할 수 없어요.'
      return
    }

    target.nickname = nickname
    target.content = content
    target.rating = Number(reviewForm.value.rating)
    target.password = password
  } else {
    reviews.value.unshift({
      id: Date.now(),
      nickname,
      content,
      rating: Number(reviewForm.value.rating),
      password,
      isDemo: false
    })
  }

  saveReviews()
  resetForm()
}

function startEdit(review) {
  editingId.value = review.id
  reviewForm.value = {
    nickname: review.nickname,
    content: review.content,
    rating: review.rating,
    password: ''
  }
  errorText.value = ''
}

function deleteReview(review) {
  const password = reviewForm.value.password.trim()

  if (!password) {
    errorText.value = '삭제하려면 비밀번호를 입력해주세요.'
    return
  }

  if (review.password !== password) {
    errorText.value = '비밀번호가 일치하지 않아 삭제할 수 없어요.'
    return
  }

  reviews.value = reviews.value.filter((item) => item.id !== review.id)
  saveReviews()

  if (editingId.value === review.id) {
    resetForm()
  } else {
    errorText.value = ''
  }
}

watch(
  resolvedFestivalId,
  () => {
    getFestivalById()
    seedDefaultReviewsForSelectedFestival()
    loadReviews()
    resetForm()
  },
  { immediate: true }
)

onMounted(() => {
  getFestivalById()
  seedDefaultReviewsForSelectedFestival()
  loadLikesMeta()
  loadMyLikes() // 💡 유저 하트 기록 가져오기 추가
  loadReviews()
})
</script>

<template>
  <div class="min-h-screen bg-white px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl space-y-8">
      <section
        v-if="selectedFestival"
        class="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-2xl shadow-black/30"
      >
        <div class="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div class="flex items-center justify-center">
            <img
              v-if="selectedFestival.firstimage"
              :src="selectedFestival.firstimage"
              :alt="selectedFestival.title"
              class="h-[340px] w-full rounded-[24px] border border-slate-200 object-cover shadow-lg"
            />
            <div
              v-else
              class="flex h-[340px] w-full items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 text-slate-500"
            >
              이미지가 없습니다
            </div>
          </div>

          <div class="flex flex-col justify-center">
            <div class="mb-4 inline-flex w-fit rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-sm font-semibold text-cyan-500">
              부산 축제 상세 소개
            </div>

            <div class="flex flex-wrap items-start justify-between gap-3">
              <h1 class="text-3xl font-bold leading-tight sm:text-4xl">
                {{ selectedFestival.title }}
              </h1>

              <!-- 💡 내가 누른 상태에 따라 하트 버튼 디자인이 연동되도록 반응형 클래스 지정 -->
              <button
                type="button"
                class="rounded-full border px-4 py-2 text-sm font-bold transition shadow-md"
                :class="isCurrentFestivalLiked 
                  ? 'border-rose-500 bg-rose-500 text-slate-900 shadow-rose-500/20 hover:bg-rose-600' 
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'"
                @click="toggleLike"
              >
                ❤️ {{ getLikeCount(selectedFestival.contentid) }}
              </button>
            </div>

            <div class="mt-5 space-y-3 text-sm text-slate-300 sm:text-base">
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-slate-500">주소</p>
                <p class="mt-1 font-medium text-slate-900">{{ selectedFestival.addr1 || '주소 정보 없음' }}</p>
              </div>

              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-slate-500">전화번호</p>
                <p class="mt-1 font-medium text-slate-900">{{ selectedFestival.tel || '전화번호 정보 없음' }}</p>
              </div>

              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-slate-500">요금</p>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    class="rounded-full border px-3 py-1 text-sm font-semibold"
                    :class="feeInfo.label === '무료'
                      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                      : feeInfo.label === '유료' || feeInfo.label === '부분 유료'
                        ? 'border-amber-400/40 bg-amber-500/10 text-amber-300'
                        : 'border-slate-600 bg-slate-700/60 text-slate-900'"
                  >
                    {{ feeInfo.label }}
                  </span>
                  <p class="text-sm leading-6 text-slate-300">{{ feeInfo.description }}</p>
                </div>
              </div>

              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-slate-500">축제 소개</p>
                <p class="mt-1 leading-7 text-slate-500">
                  {{ selectedFestival.program
                    ? selectedFestival.program.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
                    : '이 축제에 대한 구체적인 소개 정보가 아직 제공되지 않았습니다.' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-[28px] border border-slate-200 bg-slate-50 p-4 shadow-2xl shadow-black/30 sm:p-6">
        <FestivalDetailMap :selectedContentId="resolvedFestivalId" />
      </section>

      <section class="rounded-[28px] border border-slate-200 bg-slate-50 p-4 shadow-2xl shadow-black/30 sm:p-6">
        <div class="mb-5">
          <h2 class="text-2xl font-semibold text-slate-900">방문자 한 줄 리뷰</h2>
          <p class="mt-1 text-sm text-slate-500">
            시연용 리뷰와 방문자가 직접 작성한 리뷰를 함께 확인할 수 있어요.
          </p>
        </div>

        <form class="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5" @submit.prevent="submitReview">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm text-slate-900">닉네임</label>
              <input
                v-model="reviewForm.nickname"
                type="text"
                placeholder="닉네임을 입력하세요"
                class="w-full rounded-2xl border border-slate-700 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm text-slate-900">별점</label>
              <select
                v-model="reviewForm.rating"
                class="w-full rounded-2xl border border-slate-700 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400"
              >
                <option :value="5">5점</option>
                <option :value="4">4점</option>
                <option :value="3">3점</option>
                <option :value="2">2점</option>
                <option :value="1">1점</option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="mb-2 block text-sm text-slate-900">리뷰 내용</label>
              <textarea
                v-model="reviewForm.content"
                rows="4"
                placeholder="이 축제에 대한 느낌을 남겨주세요."
                class="w-full rounded-2xl border border-slate-700 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400"
              />
            </div>

            <div class="md:col-span-2">
              <label class="mb-2 block text-sm text-slate-900">비밀번호</label>
              <input
                v-model="reviewForm.password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                class="w-full rounded-2xl border border-slate-700 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              class="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
            >
              {{ editingId ? '수정 완료' : '리뷰 등록' }}
            </button>

            <button
              v-if="editingId"
              type="button"
              class="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-900 transition hover:border-slate-500 hover:text-slate-900"
              @click="resetForm"
            >
              취소
            </button>
          </div>

          <div v-if="errorText" class="mt-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {{ errorText }}
          </div>
        </form>

        <div class="mt-6 space-y-3">
          <div
            v-if="reviews.length === 0"
            class="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-5 text-center text-sm text-slate-500"
          >
            아직 등록된 리뷰가 없습니다. 첫 리뷰를 남겨보세요.
          </div>

          <div
            v-for="review in reviews"
            :key="review.id"
            class="rounded-2xl border border-slate-700 bg-slate-50 p-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div class="flex items-center gap-2">
                  <p class="font-semibold text-slate-900">{{ review.nickname }}</p>
                  <span
                    v-if="review.isDemo"
                    class="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-300"
                  >
                    시연용
                  </span>
                </div>
                <p class="text-sm text-slate-500">
                  {{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}
                </p>
              </div>

              <div class="flex gap-2">
                <button
                  type="button"
                  class="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-900 hover:border-cyan-400 hover:text-cyan-300"
                  @click="startEdit(review)"
                >
                  수정
                </button>

                <button
                  type="button"
                  class="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-900 hover:border-red-400 hover:text-red-300"
                  @click="deleteReview(review)"
                >
                  삭제
                </button>
              </div>
            </div>

            <p class="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-900">
              {{ review.content }}
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
:deep(.leaflet-container) {
  font: inherit;
}

:deep(.leaflet-popup-content-wrapper) {
  padding: 0;
  border-radius: 16px;
  overflow: hidden;
}

:deep(.leaflet-popup-content) {
  margin: 0;
}

:deep(.custom-pin),
:deep(.festival-pin) {
  background: transparent;
  border: none;
}
</style>