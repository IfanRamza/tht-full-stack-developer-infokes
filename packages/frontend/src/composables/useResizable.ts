import { onMounted, onUnmounted, ref } from 'vue'

export function useResizable(
  initialWidth = 280,
  minWidth = 200,
  maxWidth = 500
) {
  const width = ref(initialWidth)
  const isDragging = ref(false)
  const startX = ref(0)
  const startWidth = ref(0)

  const startDrag = (e: MouseEvent) => {
    isDragging.value = true
    startX.value = e.clientX
    startWidth.value = width.value
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const onDrag = (e: MouseEvent) => {
    if (!isDragging.value) return
    const diff = e.clientX - startX.value
    const newWidth = startWidth.value + diff
    width.value = Math.min(Math.max(newWidth, minWidth), maxWidth)
  }

  const stopDrag = () => {
    if (!isDragging.value) return
    isDragging.value = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  onMounted(() => {
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', stopDrag)
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup', stopDrag)
  })

  return {
    width,
    startDrag,
  }
}
