<template>
  <el-dialog v-model="longTextEditVisible" :title="`编辑 ${editableField}`" width="40%">
    <el-input v-model="longTextValue" type="textarea" :rows="10" />
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="longTextEditVisible = false">取消</el-button>
        <el-button type="primary" @click="parsingResultStore.saveLongText">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { useParsingResultStore } from '@/stores/parsingResult';
import { computed } from 'vue';

const parsingResultStore = useParsingResultStore();

const longTextEditVisible = computed({
  get: () => parsingResultStore.longTextEditVisible,
  set: (val) => parsingResultStore.longTextEditVisible = val
});

const {
  longTextValue,
  editableField,
} = parsingResultStore;
</script>