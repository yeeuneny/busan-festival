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
const myLikes = ref([])

const reviewForm = ref({
  nickname: '',
  content: '',
  rating: 5,
  password: ''
})

// 💡 축제의 contentid를 기반으로 일관된 난수를 생성하는 함수
function seededRandom(contentid, seed = 0) {
  const str = String(contentid) + String(seed)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash) % 100 / 100
}

// 💡 매우 다양한 리뷰 내용 풀 - 긍정적, 부정적, 중립적 리뷰 혼합
function getReviewPools() {
  return {
    atmosphere: [
      '분위기가 정말 좋아서 한 번 더 와도 좋을 것 같아요.',
      '현장의 에너지가 예상보다 훨씬 좋았습니다.',
      '분위기는 좋았지만 예상보다 사람이 너무 많아서 조금 아쉬웠어요.',
      '축제 곳곳의 분위기가 살아있고 생기 있었습니다.',
      '분위기는 괜찮았는데 조명이 너무 어두워서 사진 찍기가 어려웠어요.',
      '주변 환경과 어우러진 분위기가 정말 아름다웠습니다.',
      '예상과 달리 분위기가 좀 조용했어요. 좀 더 활기찬 느낌을 원했는데.',
      '도시의 야경과 어우러진 분위기가 로맨틱했습니다.',
      '현장 분위기는 좋았지만 먹을 게 별로 없어서 아쉬웠어요.'
    ],
    program: [
      '프로그램이 다양해서 하루 종일 즐길 수 있었어요.',
      '프로그램 구성이 좀 아쉬웠어요. 기대했던 것들이 빠져있었습니다.',
      '프로그램 개수는 많지만 질은 기대 이하였습니다.',
      '체험 부스가 풍부해서 온 가족이 함께 즐길 수 있었어요.',
      '프로그램 안내가 부족해서 뭘 해야 할지 헷갈렸어요.',
      '공연과 전시가 잘 어우러져서 시간 가는 줄 몰랐습니다.',
      '프로그램 정보가 더 명확했으면 좋겠어요.',
      '흥미로운 프로그램도 있고 별로인 프로그램도 섞여 있었어요.',
      '특별한 공연이 없어서 조금 아쉬웠습니다.'
    ],
    crowd: [
      '사람이 너무 많아서 제대로 구경하기 어려웠어요.',
      '생각보다 한적해서 편하게 둘러볼 수 있었습니다.',
      '주말이라 그런지 사람이 많았지만 관리를 잘 해서 괜찮았어요.',
      '인파가 정말 심각했어요. 다시 가고 싶지 않을 정도입니다.',
      '오후보다 저녁에 가니까 사람이 좀 덜했어요. 추천합니다.',
      '사람이 많아서 줄을 오래 서야 했어요.',
      '한적한 분위기에서 여유롭게 즐길 수 있었어요.',
      '사람이 많아도 질서 있게 진행되어 좋았습니다.',
      '너무 붐벼서 불쾌감을 느꼈어요.'
    ],
    accessibility: [
      '주변에 주차장이 많아서 편리했습니다.',
      '대중교통 접근성이 좋아서 쉽게 올 수 있었어요.',
      '주차비가 너무 비싼 편이었어요.',
      '가는 길이 복잡해서 처음 온 사람은 헷갈릴 수 있을 것 같아요.',
      '화장실이 충분히 배치되어 있어서 좋았습니다.',
      '휠체어 접근성이 좋아서 장애인 친구도 함께 즐길 수 있었어요.',
      '식음료 가격이 너무 비싼 것 같아요.',
      '길이 좁아서 혼잡했고 카트를 사용하는 사람들이 위험했어요.',
      '나이 많은 부모님과 함께 다니기에 계단이 많아서 힘들었어요.'
    ],
    value: [
      '입장료 대비 충분히 즐길 수 있었습니다.',
      '무료인데도 이렇게 좋은 프로그램을 제공해서 놀랐어요.',
      '입장료가 너무 비싼 것 같아요. 기대한 것보다는 덜 했어요.',
      '가성비가 정말 좋습니다. 강력 추천해요.',
      '한 번만 봐도 충분할 것 같아요. 재방문 의지는 낮아요.',
      '입장료는 저렴하지만 부대 비용이 많이 들어요.',
      '즐거운 시간이었지만 생각보다 더 많은 예산이 필요했어요.',
      '이 정도면 한 번 더 와도 좋을 것 같아요.',
      '물가가 정상보다 높아서 아쉬웠어요.'
    ],
    facility: [
      '화장실 시설이 깨끗하고 잘 관리되어 있었어요.',
      '음식점이 충분해서 끼니 때우는 데 문제없었습니다.',
      '쉬어갈 만한 벤치나 의자가 부족했어요.',
      '와이파이가 잘 잡혀서 여행 계획 짤 때 유용했습니다.',
      '휴게 공간이 너무 부족해요. 더 많았으면 좋겠어요.',
      '음식점 줄이 너무 길어서 먹을 때까지 기다렸어요.',
      '편의점 같은 가벼운 음식 거리가 많아서 좋았어요.',
      '에어컨이 없어서 여름에 가기에는 좀 불편해요.',
      '의료 시설이 있어서 안심이 되었어요.'
    ],
    timing: [
      '야간에 더 아름다운 축제인 것 같아요. 해질녘에 다시 가봐야겠어요.',
      '아침에 가니까 한적해서 사진 찍기 좋았어요.',
      '시간대별로 다른 프로그램이 있어서 여러 번 와도 좋을 것 같아요.',
      '낮에는 볼게 별로 없고 밤에 진가를 드러내는 축제네요.',
      '특정 시간의 공연을 놓쳐서 아쉬웠어요. 사전 계획이 필요합니다.',
      '개장 초반에는 한산했는데 점점 사람이 몰렸어요.',
      '폐막 시간이 빨라서 더 보고 싶은데 못 봤어요.',
      '평일에 가서 여유롭게 즐길 수 있었습니다.',
      '주말에 가니까 정말 북적거렸어요.'
    ],
    photo: [
      '포토존이 많아서 사진 찍기 정말 좋았어요.',
      '인생 샷을 남길 수 있는 명소가 몇 군데 있었습니다.',
      '포토존이 거의 없어서 아쉬웠어요.',
      'SNS 게재용 사진을 정말 많이 남겼어요.',
      '조명과 배경이 예뻐서 누구나 사진이 잘 나올 것 같습니다.',
      '사진 맛집이라고 할 만한 장소가 별로 없었어요.',
      '야간 조명이 참 아름다워서 밤에 꼭 와봐야 할 것 같아요.',
      '사진 배경이 좋긴 한데 사람이 많아서 구도 잡기 어려웠어요.'
    ],
    vibe: [
      '가족 단위로 즐기기에 안성맞춤입니다.',
      '연인과 함께 오기에 분위기가 정말 좋아요.',
      '친구들끼리 가기에 활기찬 분위기가 살아있어요.',
      '혼자 와도 어색하지 않은 축제였어요.',
      '어른들끼리 와도 즐길 만한 프로그램이 충분했습니다.',
      '어린아이들이 너무 떠들어서 조용한 분위기를 원했던 나에겐 아쉬웠어요.',
      '날씨가 안 좋아도 충분히 즐길 수 있는 실내 공간이 있어요.',
      '젊은 세대를 위한 프로그램이 많아��� 좋았어요.'
    ],
    nature: [
      '부산의 자연을 제대로 느낄 수 있는 축제였어요.',
      '해안 풍경과 어우러진 축제가 정말 아름다웠습니다.',
      '도시 한복판에서 여유로운 시간을 보낼 수 있었어요.',
      '산과 바다의 조화가 정말 좋았습니다.',
      '실내에만 있어서 자연을 느끼지 못했어요.',
      '야외 공간이 너무 협소해서 아쉬웠어요.',
      '날씨가 좋아서 더욱 즐거운 경험이었습니다.',
      '해질녘의 풍경이 정말 인상적이었어요.'
    ],
    overall: [
      '부산 여행 최고의 선택이었습니다.',
      '기대보다 훨씬 좋았어요. 꼭 다시 가고 싶습니다.',
      '그냥 평범한 축제였어요. 굳이 또 가진 않을 것 같아요.',
      '기대를 초과한 훌륭한 축제였습니다.',
      '시간이 더 있었으면 더 즐겼을 것 같아요.',
      '한국을 대표할 수 있는 축제라고 생각해요.',
      '조금 아쉬운 부분도 있지만 전반적으로는 만족스러웠어요.',
      '이 축제는 부산 방문 시 필수 코스가 되어야 해요.',
      '친구들한테 강력히 추천해야겠어요.'
    ]
  }
}

// 💡 축제별로 고유한 리뷰를 생성하는 함수 - 대폭 개선
function getSeedReviewsForFestival(festival) {
  if (!festival) return []

  const contentid = festival.contentid
  const pools = getReviewPools()
  
  // 닉네임 풀 - 더 다양함
  const nicknamePool = [
    '부산여행자', '축제덕후', '감성여행', '주말나들이', '가족동반',
    '친구들과', '혼자여행', '사진작가', '맛집투어', '야경좋아',
    '자연사랑', '문화팬', '예술애호가', '트렌드세터', '이웃주민',
    '여행블로거', '부산토박이', '주말전사', '감성충전', '추억만들기',
    '경험수집가', '로컬가이드', '맛있는시간', '사진덕', '휴식',
    '활기찬일상', '느린여행', '가치있는시간', '특별한경험', '행복추구'
  ]

  // 💡 축제의 contentid를 기반으로 3~5개의 고유한 리뷰 생성
  const reviewCount = Math.floor(seededRandom(contentid, 100) * 3) + 3 // 3~5개
  const seededReviews = []

  for (let i = 0; i < reviewCount; i++) {
    const nicknameIdx = Math.floor(seededRandom(contentid, i * 10) * nicknamePool.length)
    const ratingVal = Math.floor(seededRandom(contentid, i * 30) * 5) + 1 // 1~5점
    
    // 리뷰 내용 조합 - 1~3개의 다른 카테고리에서 선택
    const categoryKeys = Object.keys(pools)
    const selectedCategories = []
    
    // 이 축제를 위해 선택할 카테고리 수 결정 (2~3개)
    const categoryCount = Math.floor(seededRandom(contentid, i * 50) * 2) + 2
    
    for (let j = 0; j < categoryCount; j++) {
      const catIdx = Math.floor(seededRandom(contentid, i * 60 + j * 7) * categoryKeys.length)
      const category = categoryKeys[catIdx]
      if (!selectedCategories.includes(category)) {
        selectedCategories.push(category)
      }
    }

    // 선택된 각 카테고리에서 리뷰 구절 하나씩 선택
    const reviewParts = selectedCategories.map(category => {
      const categoryPool = pools[category]
      const partIdx = Math.floor(seededRandom(contentid, i * 70 + category.charCodeAt(0)) * categoryPool.length)
      return categoryPool[partIdx]
    })

    // 리뷰 내용 조합 (마침표 추가)
    const content = reviewParts.map(part => {
      // 이미 마침표가 있으면 그대로, 없으면 추가
      return part.endsWith('') ? part : part + (part.endsWith('.') || part.endsWith('요.') || part.endsWith('어요.') ? '' : '')
    }).join(' ')

    seededReviews.push({
      id: Date.now() + i * 1000,
      nickname: nicknamePool[nicknameIdx],
      content: content,
      rating: ratingVal,
      password: 'seed'
    })
  }

  return seededReviews
}

function seedDefaultReviewsForSelectedFestival() {
  if (typeof window === 'undefined' || !selectedFestival.value) return

  const key = storageKey.value

  try {
    const raw = window.localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return
      }
    }
  } catch {
    // 기존 리뷰가 없거나 파싱 실패 시 기본 후기로 채워 넣음
  }

  const seededReviews = getSeedReviewsForFestival(selectedFestival.value)

  if (seededReviews.length > 0) {
    window.localStorage.setItem(key, JSON.stringify(seededReviews))
  }
}

const resolvedFestivalId = computed(() => {
  const rawValue = props.festivalId ?? props.contentid ?? ''
  return String(rawValue).trim() || '506545'
})

const storageKey = computed(() => `festival-reviews-${resolvedFestivalId.value}`)
const likesStorageKey = 'busan-festival-likes-meta-v2'
const myLikesStorageKey = 'busan-festival-user-liked' 

const isCurrentFestivalLiked = computed(() => {
  if (!selectedFestival.value) return false
  return myLikes.value.includes(String(selectedFestival.value.contentid))
})

const dDayText = computed(() => {
  if (!selectedFestival.value || !selectedFestival.value.eventstartdate) return ''

  const startStr = selectedFestival.value.eventstartdate 
  const endStr = selectedFestival.value.eventenddate     

  const sYear = parseInt(startStr.substring(0, 4))
  const sMonth = parseInt(startStr.substring(4, 6)) - 1
  const sDay = parseInt(startStr.substring(6, 8))

  const eYear = parseInt(endStr.substring(0, 4))
  const eMonth = parseInt(endStr.substring(4, 6)) - 1
  const eDay = parseInt(endStr.substring(6, 8))

  const startDate = new Date(sYear, sMonth, sDay)
  const endDate = new Date(eYear, eMonth, eDay, 23, 59, 59)
  const today = new Date()

  const todayPure = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startPure = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())

  const diffMs = startPure.getTime() - todayPure.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (today > endDate) {
    return '종료된 축제'
  } else if (today >= startDate && today <= endDate) {
    return '🥳 진행 중!'
  } else if (diffDays === 0) {
    return '🔥 오늘 시작!'
  } else {
    return `D-${diffDays}`
  }
})

function formatDate(dateStr) {
  if (!dateStr) return '정보 없음'
  return `${dateStr.substring(0, 4)}년 ${dateStr.substring(4, 6)}월 ${dateStr.substring(6, 8)}일`
}

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
  window.dispatchEvent(new Event('likes-meta-updated'))
}

function saveMyLikes() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(myLikesStorageKey, JSON.stringify(myLikes.value))
}

function getLikeCount(contentid) {
  const value = likesMeta.value?.[String(contentid)]
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toggleLike() {
  if (!selectedFestival.value) return

  const id = String(selectedFestival.value.contentid)
  const currentCount = getLikeCount(id)

  if (isCurrentFestivalLiked.value) {
    likesMeta.value = {
      ...likesMeta.value,
      [id]: Math.max(0, currentCount - 1)
    }
    myLikes.value = myLikes.value.filter((item) => item !== id)
  } else {
    likesMeta.value = {
      ...likesMeta.value,
      [id]: currentCount + 1
    }
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
  window.localStorage.setItem(storageKey.value, JSON.stringify(reviews.value))
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
      password
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
    loadReviews()
    resetForm()
  },
  { immediate: true }
)

onMounted(() => {
  getFestivalById()
  loadLikesMeta()
  loadMyLikes()
  loadReviews()
})
</script>

<template>
  <div class="min-h-screen bg-white px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl space-y-8">
      <section
        v-if="selectedFestival"
        class="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-2xl shadow-black/30">
        <div class="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          
          <!-- 🌟 [개선 핵심] 상단 와이드 타이틀 헤더 바 (col-span-full로 2열 전체를 덮어 씌움) -->
          <div class="col-span-full border-b border-slate-200 pb-5">
            <div class="mb-3 inline-flex w-fit rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
              부산 축제 상세 소개
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div class="flex flex-wrap items-center gap-3">
                <h1 class="text-2xl font-black leading-tight sm:text-3xl text-slate-900">
                  {{ selectedFestival.title }}
                </h1>
                
                <!-- 남은 일수 디데이 배지 -->
                <span 
                  v-if="dDayText"
                  class="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-black text-slate-950 shadow-md shadow-orange-500/10"
                >
                  {{ dDayText }}
                </span>
              </div>

              <!-- 좋아요 버튼 -->
              <button
                type="button"
                class="rounded-full border px-4 py-2 text-sm font-bold transition shadow-md self-start sm:self-auto shrink-0"
                :class="isCurrentFestivalLiked
                  ? 'border-rose-500 bg-rose-500 text-slate-900 shadow-rose-500/20 hover:bg-rose-600'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'"
                @click="toggleLike"
              >
                ❤️ {{ getLikeCount(selectedFestival.contentid) }}
              </button>
            </div>
          </div>
          
          <!-- 📸 좌측 컬럼: 축제 포스터 영역 (제목 아래로 안전하게 정렬됨) -->
          <div class="flex items-center justify-center bg-slate-50 rounded-[24px] border border-slate-200 p-2 overflow-hidden shadow-inner h-[396px]">
            <div class="w-full h-full overflow-hidden flex items-center justify-center rounded-xl relative select-none">
              <img
                v-if="selectedFestival.firstimage"
                :src="selectedFestival.firstimage"
                :alt="selectedFestival.title"
                class="h-[380px] w-full object-contain rounded-xl shadow-md"
              />
              <div
                v-else
                class="flex h-[380px] w-full items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/60 text-slate-400"
              >
                이미지가 없습니다
              </div>
            </div>
          </div>

          <!-- 📑 우측 컬럼: 상세 메타데이터 출력 스크롤 플레이트 (사진과 균형을 이루도록 max-h 커스텀) -->
          <div class="flex flex-col justify-start">
            <div class="space-y-3.5 text-sm text-slate-400 sm:text-base max-h-[396px] overflow-y-auto pr-2 scrollbar-thin">
              
              <!-- 1. 축제 시작일과 종료일 -->
              <div class="rounded-2xl border border-slate-200 bg-slate-40 p-4">
                <p class="text-xs font-bold text-slate-900 tracking-wider">🗓️ 축제 기간</p>
                <p class="mt-1.5 font-medium text-slate-900">
                  {{ formatDate(selectedFestival.eventstartdate) }} ~ {{ formatDate(selectedFestival.eventenddate) }}
                </p>
              </div>

              <!-- 2. 축제 장소 -->
              <div class="rounded-2xl border border-slate-200 bg-slate-40 p-4">
                <p class="text-xs font-bold text-slate-900 tracking-wider">📍 축제 장소 (eventplace)</p>
                <p class="mt-1.5 font-medium text-slate-900">{{ selectedFestival.eventplace || '장소 정보 없음' }}</p>
                <p class="mt-1 text-xs text-slate-900">{{ selectedFestival.addr1 }}</p>
              </div>

              <!-- 3. playtime -->
              <div class="rounded-2xl border border-slate-200 bg-slate-40 p-4">
                <p class="text-xs font-bold text-slate-900 tracking-wider">⏰ 운영 시간 (playtime)</p>
                <p class="mt-1.5 font-medium text-slate-900">{{ selectedFestival.playtime || '시간 정보 없음' }}</p>
              </div>

              <!-- 4. usetimefestival -->
              <div class="rounded-2xl border border-slate-200 bg-slate-40 p-4">
                <p class="text-xs font-bold text-slate-900 tracking-wider">💰 이용 요금 (usetimefestival)</p>
                <p class="mt-1.5 font-medium text-slate-900" v-html="selectedFestival.usetimefestival || '정보 없음'"></p>
              </div>

              <!-- 5. program -->
              <div class="rounded-2xl border border-slate-200 bg-slate-40 p-4">
                <p class="text-xs font-bold text-slate-900 tracking-wider">📑 주요 프로그램 (program)</p>
                <p class="mt-1.5 leading-relaxed text-slate-900 whitespace-pre-wrap text-sm">{{ selectedFestival.program || '프로그램 내용이 없습니다.' }}</p>
              </div>

            </div>
          </div>
        </div>
      </section>


      <!-- 지도 및 하단 한 줄 리뷰 섹션 데이터 유지 -->
      <section class="rounded-[28px] border border-slate-200 bg-slate-50 p-4 shadow-2xl shadow-black/30 sm:p-6">
        <FestivalDetailMap :selectedContentId="resolvedFestivalId" />
      </section>

      <section class="rounded-[28px] border border-slate-200 bg-slate-50 p-4 shadow-2xl shadow-black/30 sm:p-6">
        <div class="mb-4">
          <h2 class="text-2xl font-semibold text-slate-900">방문자 한 줄 리뷰</h2>
          <p class="mt-1 text-sm text-slate-600">
            이 축제에 대한 솔직한 후기를 남겨주세요. 수정과 삭제는 비밀번호가 맞아야 가능합니다.
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
                class="w-full rounded-2xl border border-slate-700 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm text-slate-900">별점</label>
              <select
                v-model="reviewForm.rating"
                class="w-full rounded-2xl border border-slate-700 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
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
                class="w-full rounded-2xl border border-slate-700 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
              />
            </div>

            <div class="md:col-span-2">
              <label class="mb-2 block text-sm text-slate-900">비밀번호</label>
              <input
                v-model="reviewForm.password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                class="w-full rounded-2xl border border-slate-700 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              class="rounded-full bg-sky-500 px-4 py-2 text-m font-semibold text-slate-900 transition hover:bg-sky-500"
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
            class="rounded-2xl border border-dashed border-slate-700 bg-slate-50 p-5 text-center text-sm text-slate-500"
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
                    class="rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-300"
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
                  class="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-900 hover:border-sky-400 hover:text-sky-300"
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

.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
}
</style>