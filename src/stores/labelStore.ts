import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LabelSet } from '../types'
import { db, STORE_LABEL_SETS } from '../utils/db'

// Simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 9)

// Common colors for labeling (64 distinct colors)
export const PRESET_COLORS = [
  // High Contrast / Bright Colors (Priority)
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF', 
  '#FFA500', '#800080', '#FF1493', '#00FA9A', '#1E90FF', '#FFD700',
  '#FF4500', '#DA70D6', '#87CEEB', '#32CD32', '#F08080', '#40E0D0',

  // Reds/Pinks
  '#DC143C', '#B22222', '#8B0000', '#FF69B4', '#C71585', '#DB7093',
  // Oranges/Yellows
  '#FF8C00', '#F0E68C', '#BDB76B', '#EEE8AA',
  // Greens
  '#008000', '#006400', '#90EE90', '#20B2AA', '#2E8B57',
  // Cyans/Blues
  '#00CED1', '#4682B4', '#0000CD', '#000080', 
  // Purples/Violets
  '#8A2BE2', '#9400D3', '#9932CC', '#BA55D3', '#EE82EE', '#483D8B',
  // Browns/Beiges
  '#A52A2A', '#8B4513', '#D2691E', '#CD853F', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F',
  // Grays/Misc
  '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#708090', '#2F4F4F', '#556B2F', '#6B8E23',
  // Pastels
  '#FF7F50', '#FA8072', '#E9967A', '#FF6347', '#FFDAB9', '#FFE4B5', '#F0FFF0', '#F0F8FF'
]

export const useLabelStore = defineStore('label', () => {
  const labelSets = ref<LabelSet[]>([])
  const isInitialized = ref(false)

  async function init() {
    try {
        const sets = await db.getAll<LabelSet>(STORE_LABEL_SETS)
        if (sets.length > 0) {
            labelSets.value = sets
        }
    } catch (e) {
        console.error('Failed to init label store:', e)
    } finally {
        isInitialized.value = true
    }
  }

  async function addLabelSet(labelSet: Omit<LabelSet, 'id'>) {
    const newSet: LabelSet = {
      ...labelSet,
      id: generateId()
    }
    
    // Update local state immediately for responsiveness
    labelSets.value.push(newSet)
    
    // Persist
    await db.put(STORE_LABEL_SETS, JSON.parse(JSON.stringify(newSet)))
    
    return newSet
  }

  async function updateLabelSet(id: string, updates: Partial<Omit<LabelSet, 'id'>>) {
    const index = labelSets.value.findIndex(set => set.id === id)
    if (index !== -1) {
      const updatedSet = {
        ...labelSets.value[index],
        ...updates
      } as LabelSet
      
      // Update local state
      labelSets.value[index] = updatedSet
      
      // Persist
      await db.put(STORE_LABEL_SETS, JSON.parse(JSON.stringify(updatedSet)))
    }
  }

  async function deleteLabelSet(id: string) {
    // Update local state
    labelSets.value = labelSets.value.filter(set => set.id !== id)
    
    // Persist
    await db.delete(STORE_LABEL_SETS, id)
  }

  function getLabelSetById(id: string) {
    return labelSets.value.find(set => set.id === id)
  }

  // Start initialization
  init()

  return {
    labelSets,
    isInitialized,
    addLabelSet,
    updateLabelSet,
    deleteLabelSet,
    getLabelSetById,
    init
  }
})
